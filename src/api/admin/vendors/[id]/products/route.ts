import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { VENDOR_MODULE } from "../../../../../modules/vendor";
import VendorModuleService from "../../../../../modules/vendor/service";
import { addVendorProductSchema } from "../../validation-schemas";

type LinkRecord = Record<string, any>;

const normalizeLinkList = (result: unknown): LinkRecord[] => {
  if (Array.isArray(result)) {
    return result as LinkRecord[];
  }

  if (result && typeof result === "object" && "data" in result) {
    const data = (result as { data?: unknown }).data;
    return Array.isArray(data) ? (data as LinkRecord[]) : [];
  }

  return [];
};

const extractProductId = (link: LinkRecord): string | null => {
  if (typeof link.product_id === "string") {
    return link.product_id;
  }

  if (typeof link.productId === "string") {
    return link.productId;
  }

  if (link?.product?.id) {
    return link.product.id;
  }

  if (link?.data?.product_id) {
    return link.data.product_id;
  }

  if (link?.data?.product?.id) {
    return link.data.product.id;
  }

  const productEntry = link[Modules.PRODUCT];
  if (productEntry?.product_id) {
    return productEntry.product_id;
  }
  if (productEntry?.id) {
    return productEntry.id;
  }

  return null;
};

const extractVendorId = (link: LinkRecord): string | null => {
  if (typeof link.vendor_id === "string") {
    return link.vendor_id;
  }

  if (typeof link.vendorId === "string") {
    return link.vendorId;
  }

  if (link?.vendor?.id) {
    return link.vendor.id;
  }

  if (link?.data?.vendor_id) {
    return link.data.vendor_id;
  }

  if (link?.data?.vendor?.id) {
    return link.data.vendor.id;
  }

  const vendorEntry = link[VENDOR_MODULE];
  if (vendorEntry?.vendor_id) {
    return vendorEntry.vendor_id;
  }
  if (vendorEntry?.id) {
    return vendorEntry.id;
  }

  return null;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );
  await vendorModuleService.retrieveVendor(req.params.id);

  const linkService = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const listResult = await linkService.list({
    [VENDOR_MODULE]: { vendor_id: req.params.id },
    [Modules.PRODUCT]: {},
  });

  const links = normalizeLinkList(listResult);
  const productIds = Array.from(
    new Set(links.map(extractProductId).filter(Boolean))
  ) as string[];

  const vendor_products = productIds.map((product_id) => ({ product_id }));

  return res.status(200).json({ vendor_products, product_ids: productIds });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = addVendorProductSchema.parse(req.body);

  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );
  await vendorModuleService.retrieveVendor(req.params.id);

  const linkService = req.scope.resolve(ContainerRegistrationKeys.LINK);

  const existingForVendor = await linkService.list({
    [VENDOR_MODULE]: { vendor_id: req.params.id },
    [Modules.PRODUCT]: { product_id: validatedBody.product_id },
  });

  const vendorLinks = normalizeLinkList(existingForVendor);
  if (vendorLinks.length > 0) {
    return res.status(200).json({
      vendor_product: {
        vendor_id: req.params.id,
        product_id: validatedBody.product_id,
      },
    });
  }

  const existingForProduct = await linkService.list({
    [Modules.PRODUCT]: { product_id: validatedBody.product_id },
  });

  const productLinks = normalizeLinkList(existingForProduct);
  const linkedVendorId = productLinks
    .map(extractVendorId)
    .find((vendorId) => vendorId && vendorId !== req.params.id);

  if (linkedVendorId) {
    return res.status(409).json({
      message: "Product is already linked to another vendor.",
    });
  }

  await linkService.create({
    [VENDOR_MODULE]: { vendor_id: req.params.id },
    [Modules.PRODUCT]: { product_id: validatedBody.product_id },
  });

  return res.status(200).json({
    vendor_product: {
      vendor_id: req.params.id,
      product_id: validatedBody.product_id,
    },
  });
}
