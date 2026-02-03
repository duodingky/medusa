import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
  composeLinkName,
} from "@medusajs/framework/utils";
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

type RemoteLinkService = {
  list: (
    linkDef: Record<string, unknown> | Record<string, unknown>[],
    options?: { asLinkDefinition?: boolean }
  ) => Promise<Array<{ vendor_id?: string; product_id?: string }>>;
  create: (linkDef: Record<string, unknown> | Record<string, unknown>[]) => Promise<unknown>;
};

const getVendorProductLinkAccess = (req: MedusaRequest) => {
  const serviceKey = composeLinkName(
    VENDOR_MODULE,
    "vendor_id",
    Modules.PRODUCT,
    "product_id"
  );
  try {
    return {
      mode: "module" as const,
      service: req.scope.resolve(serviceKey) as VendorProductLinkService,
    };
  } catch (error) {
    return {
      mode: "remote" as const,
      service: req.scope.resolve(
        ContainerRegistrationKeys.LINK
      ) as RemoteLinkService,
    };
  }
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );
  await vendorModuleService.retrieveVendor(req.params.id);

  const linkAccess = getVendorProductLinkAccess(req);
  const links =
    linkAccess.mode === "module"
      ? await linkAccess.service.list({
          vendor_id: req.params.id,
        })
      : await linkAccess.service.list({
          [VENDOR_MODULE]: { vendor_id: req.params.id },
          [Modules.PRODUCT]: { product_id: { $ne: null } },
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

  const linkAccess = getVendorProductLinkAccess(req);
  const existingForVendor =
    linkAccess.mode === "module"
      ? await linkAccess.service.list(
          {
            vendor_id: req.params.id,
            product_id: validatedBody.product_id,
          },
          { take: 1 }
        )
      : await linkAccess.service.list({
          [VENDOR_MODULE]: { vendor_id: req.params.id },
          [Modules.PRODUCT]: { product_id: validatedBody.product_id },
        });

  if (existingForVendor.length > 0) {
    return res.status(200).json({
      vendor_product: {
        vendor_id: req.params.id,
        product_id: validatedBody.product_id,
      },
    });
  }

  const existingForProduct =
    linkAccess.mode === "module"
      ? await linkAccess.service.list(
          {
            product_id: validatedBody.product_id,
          },
          { take: 1 }
        )
      : await linkAccess.service.list({
          [VENDOR_MODULE]: { vendor_id: { $ne: null } },
          [Modules.PRODUCT]: { product_id: validatedBody.product_id },
        });
  const linkedVendorId = existingForProduct.find(
    (link) => link.vendor_id && link.vendor_id !== req.params.id
  )?.vendor_id;

  if (linkedVendorId) {
    return res.status(409).json({
      message: "Product is already linked to another vendor.",
    });
  }

  if (linkAccess.mode === "module") {
    await linkAccess.service.create(req.params.id, validatedBody.product_id);
  } else {
    await linkAccess.service.create({
      [VENDOR_MODULE]: { vendor_id: req.params.id },
      [Modules.PRODUCT]: { product_id: validatedBody.product_id },
    });
  }

  return res.status(200).json({
    vendor_product: {
      vendor_id: req.params.id,
      product_id: validatedBody.product_id,
    },
  });
}
