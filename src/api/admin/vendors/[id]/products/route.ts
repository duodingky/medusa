import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { VENDOR_MODULE } from "../../../../../modules/vendor";
import VendorModuleService from "../../../../../modules/vendor/service";
import { addVendorProductSchema } from "../../validation-schemas";
import {
  buildVendorProductLinkDefinition,
  getVendorProductLinkAccess,
} from "../../vendor-product-link";

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
      : await linkAccess.service.list(
          buildVendorProductLinkDefinition(
            { vendor_id: req.params.id },
            { product_id: { $ne: null } }
          )
        );
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
      : await linkAccess.service.list(
          buildVendorProductLinkDefinition(
            { vendor_id: req.params.id },
            { product_id: validatedBody.product_id }
          )
        );

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
      : await linkAccess.service.list(
          buildVendorProductLinkDefinition(
            { vendor_id: { $ne: null } },
            { product_id: validatedBody.product_id }
          )
        );
  const linkedVendors = existingForProduct
    .map((link) => link.vendor_id)
    .filter(
      (vendorId): vendorId is string => !!vendorId && vendorId !== req.params.id
    );

  if (linkedVendors.length > 0) {
    if (linkAccess.mode === "module") {
      for (const vendorId of new Set(linkedVendors)) {
        await linkAccess.service.dismiss(vendorId, validatedBody.product_id);
      }
    } else {
      await linkAccess.service.dismiss(
        Array.from(new Set(linkedVendors)).map((vendorId) => ({
          ...buildVendorProductLinkDefinition(
            { vendor_id: vendorId },
            { product_id: validatedBody.product_id }
          ),
        }))
      );
    }
  }

  if (linkAccess.mode === "module") {
    await linkAccess.service.create(req.params.id, validatedBody.product_id);
  } else {
    await linkAccess.service.create(
      buildVendorProductLinkDefinition(
        { vendor_id: req.params.id },
        { product_id: validatedBody.product_id }
      )
    );
  }

  return res.status(200).json({
    vendor_product: {
      vendor_id: req.params.id,
      product_id: validatedBody.product_id,
    },
  });
}
