import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { VENDOR_MODULE } from "../../../../../../modules/vendor";

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const linkService = remoteLink.getLinkModule(
    VENDOR_MODULE,
    "vendor_id",
    Modules.PRODUCT,
    "product_id"
  );

  if (!linkService) {
    return res.status(404).json({
      message: "Vendor products link is not configured.",
    });
  }

  const existingLinks = await linkService.list({
    vendor_id: req.params.id,
    product_id: req.params.product_id,
  });

  if (existingLinks.length === 0) {
    return res.status(404).json({
      message: "Product is not linked to this vendor.",
    });
  }

  await remoteLink.dismiss([
    {
      [VENDOR_MODULE]: {
        vendor_id: req.params.id,
      },
      [Modules.PRODUCT]: {
        product_id: req.params.product_id,
      },
    },
  ]);

  return res.status(200).json({
    vendor_id: req.params.id,
    product_id: req.params.product_id,
    deleted: true,
  });
}
