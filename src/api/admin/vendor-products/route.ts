import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  buildVendorProductLinkDefinition,
  getVendorProductLinkAccess,
} from "../vendors/vendor-product-link";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const linkAccess = getVendorProductLinkAccess(req);

  const links =
    linkAccess.mode === "module"
      ? await linkAccess.service.list({})
      : await linkAccess.service.list(
          buildVendorProductLinkDefinition(
            { vendor_id: { $ne: null } },
            { product_id: { $ne: null } }
          )
        );

  const vendor_products = links
    .filter((link) => link.vendor_id && link.product_id)
    .map((link) => ({
      vendor_id: link.vendor_id as string,
      product_id: link.product_id as string,
    }));

  return res.status(200).json({ vendor_products });
}
