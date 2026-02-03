import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules, composeLinkName } from "@medusajs/framework/utils";
import { VENDOR_MODULE } from "../../../../../modules/vendor";
import VendorModuleService from "../../../../../modules/vendor/service";
import { addVendorProductSchema } from "../../validation-schemas";

type VendorProductLinkService = {
  list: (
    filters: Record<string, unknown>,
    config?: { take?: number }
  ) => Promise<Array<{ vendor_id?: string; product_id?: string }>>;
  create: (vendorId: string, productId: string) => Promise<unknown>;
};

const getVendorProductLinkService = (req: MedusaRequest) => {
  const serviceKey = composeLinkName(
    VENDOR_MODULE,
    "vendor_id",
    Modules.PRODUCT,
    "product_id"
  );
  return req.scope.resolve(serviceKey) as VendorProductLinkService;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );
  await vendorModuleService.retrieveVendor(req.params.id);

  const linkService = getVendorProductLinkService(req);
  const links = await linkService.list({
    vendor_id: req.params.id,
  });
  const productIds = Array.from(
    new Set(
      links
        .map((link) => link.product_id)
        .filter((productId): productId is string => !!productId)
    )
  );

  const vendor_products = productIds.map((product_id) => ({ product_id }));

  return res.status(200).json({ vendor_products, product_ids: productIds });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = addVendorProductSchema.parse(req.body);

  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );
  await vendorModuleService.retrieveVendor(req.params.id);

  const linkService = getVendorProductLinkService(req);
  const existingForVendor = await linkService.list(
    {
      vendor_id: req.params.id,
      product_id: validatedBody.product_id,
    },
    { take: 1 }
  );

  if (existingForVendor.length > 0) {
    return res.status(200).json({
      vendor_product: {
        vendor_id: req.params.id,
        product_id: validatedBody.product_id,
      },
    });
  }

  const existingForProduct = await linkService.list(
    {
      product_id: validatedBody.product_id,
    },
    { take: 1 }
  );
  const linkedVendorId = existingForProduct.find(
    (link) => link.vendor_id && link.vendor_id !== req.params.id
  )?.vendor_id;

  if (linkedVendorId) {
    return res.status(409).json({
      message: "Product is already linked to another vendor.",
    });
  }

  await linkService.create(req.params.id, validatedBody.product_id);

  return res.status(200).json({
    vendor_product: {
      vendor_id: req.params.id,
      product_id: validatedBody.product_id,
    },
  });
}
