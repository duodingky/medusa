import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { VENDOR_MODULE } from "../../../modules/vendor";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
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

  const vendor_products = await linkService.list(
    {},
    { select: ["vendor_id", "product_id"] }
  );

  return res.status(200).json({ vendor_products });
}
