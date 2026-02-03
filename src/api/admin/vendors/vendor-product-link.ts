import { MedusaRequest } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
  composeLinkName,
} from "@medusajs/framework/utils";
import { VENDOR_MODULE } from "../../../modules/vendor";

export type VendorProductLink = {
  vendor_id?: string;
  product_id?: string;
};

export type VendorProductModuleLinkService = {
  list: (
    filters: Record<string, unknown>,
    config?: { take?: number }
  ) => Promise<VendorProductLink[]>;
  create: (vendorId: string, productId: string) => Promise<unknown>;
  dismiss: (vendorId: string, productId: string) => Promise<unknown>;
};

export type VendorProductRemoteLinkService = {
  list: (
    linkDef: Record<string, unknown> | Record<string, unknown>[],
    options?: { asLinkDefinition?: boolean }
  ) => Promise<VendorProductLink[]>;
  create: (linkDef: Record<string, unknown> | Record<string, unknown>[]) => Promise<unknown>;
  dismiss: (
    linkDef: Record<string, unknown> | Record<string, unknown>[]
  ) => Promise<unknown>;
};

export type VendorProductLinkAccess =
  | { mode: "module"; service: VendorProductModuleLinkService }
  | { mode: "remote"; service: VendorProductRemoteLinkService };

export const getVendorProductLinkAccess = (
  req: MedusaRequest
): VendorProductLinkAccess => {
  const serviceKey = composeLinkName(
    VENDOR_MODULE,
    "vendor_id",
    Modules.PRODUCT,
    "product_id"
  );

  try {
    return {
      mode: "module",
      service: req.scope.resolve(serviceKey) as VendorProductModuleLinkService,
    };
  } catch (error) {
    return {
      mode: "remote",
      service: req.scope.resolve(
        ContainerRegistrationKeys.LINK
      ) as VendorProductRemoteLinkService,
    };
  }
};

export const buildVendorProductLinkDefinition = (
  vendor: Record<string, unknown>,
  product: Record<string, unknown>
) => ({
  [VENDOR_MODULE]: vendor,
  [Modules.PRODUCT]: product,
});
