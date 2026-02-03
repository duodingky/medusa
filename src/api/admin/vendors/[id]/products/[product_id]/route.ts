import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
  composeLinkName,
} from "@medusajs/framework/utils";
import { VENDOR_MODULE } from "../../../../../../modules/vendor";
import VendorModuleService from "../../../../../../modules/vendor/service";

type VendorProductLinkService = {
  list: (
    filters: Record<string, unknown>,
    config?: { take?: number }
  ) => Promise<Array<{ vendor_id?: string; product_id?: string }>>;
  dismiss: (vendorId: string, productId: string) => Promise<unknown>;
};

type RemoteLinkService = {
  list: (
    linkDef: Record<string, unknown> | Record<string, unknown>[],
    options?: { asLinkDefinition?: boolean }
  ) => Promise<Array<{ vendor_id?: string; product_id?: string }>>;
  dismiss: (
    linkDef: Record<string, unknown> | Record<string, unknown>[]
  ) => Promise<unknown>;
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
      : await linkAccess.service.list({
          [VENDOR_MODULE]: { vendor_id: req.params.id },
          [Modules.PRODUCT]: { product_id: req.params.product_id },
        });

  if (existing.length === 0) {
    return res.status(404).json({
      message: "Product is not linked to this vendor.",
    });
  }

  if (linkAccess.mode === "module") {
    await linkAccess.service.dismiss(req.params.id, req.params.product_id);
  } else {
    await linkAccess.service.dismiss({
      [VENDOR_MODULE]: { vendor_id: req.params.id },
      [Modules.PRODUCT]: { product_id: req.params.product_id },
    });
  }

  return res.status(200).json({
    vendor_id: req.params.id,
    product_id: req.params.product_id,
    deleted: true,
  });
}
