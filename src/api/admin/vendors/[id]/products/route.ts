import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { VENDOR_MODULE } from "../../../../../modules/vendor";
import VendorModuleService from "../../../../../modules/vendor/service";
import { addVendorProductSchema } from "../../validation-schemas";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = addVendorProductSchema.parse(req.body);

  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );
  const productService = req.scope.resolve(Modules.PRODUCT) as {
    retrieveProduct: (id: string) => Promise<unknown>;
  };

  await vendorModuleService.retrieveVendor(req.params.id);
  await productService.retrieveProduct(validatedBody.product_id);

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
    product_id: validatedBody.product_id,
  });
  const existingLink = existingLinks[0];

  if (existingLink && existingLink.vendor_id !== req.params.id) {
    return res.status(409).json({
      message: "Product is already linked to another vendor.",
    });
  }

  if (existingLink) {
    return res.status(200).json({ vendor_product: existingLink });
  }

  const [vendor_product] = await remoteLink.create([
    {
      [VENDOR_MODULE]: {
        vendor_id: req.params.id,
      },
      [Modules.PRODUCT]: {
        product_id: validatedBody.product_id,
      },
    },
  ]);

  return res.status(200).json({ vendor_product });
}
