import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { VENDOR_MODULE } from "../../../../../../modules/vendor";
import VendorModuleService from "../../../../../../modules/vendor/service";
import {
  buildVendorProductLinkDefinition,
  getVendorProductLinkAccess,
} from "../../vendor-product-link";

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );
  await vendorModuleService.retrieveVendor(req.params.id);

  const linkAccess = getVendorProductLinkAccess(req);
  const existing =
    linkAccess.mode === "module"
      ? await linkAccess.service.list(
          {
            vendor_id: req.params.id,
            product_id: req.params.product_id,
          },
          { take: 1 }
        )
      : await linkAccess.service.list(
          buildVendorProductLinkDefinition(
            { vendor_id: req.params.id },
            { product_id: req.params.product_id }
          )
        );

  if (existing.length === 0) {
    return res.status(404).json({
      message: "Product is not linked to this vendor.",
    });
  }

  if (linkAccess.mode === "module") {
    await linkAccess.service.dismiss(req.params.id, req.params.product_id);
  } else {
    await linkAccess.service.dismiss(
      buildVendorProductLinkDefinition(
        { vendor_id: req.params.id },
        { product_id: req.params.product_id }
      )
    );
  }

  return res.status(200).json({
    vendor_id: req.params.id,
    product_id: req.params.product_id,
    deleted: true,
  });
}
