import { InferTypeOf } from "@medusajs/framework/types";
import { ServiceFee as ServiceFeeModel } from "../models/service-fee";

export enum ChargingLevel {
  GLOBAL = "global",
  ITEM_LEVEL = "item_level",
  SHOP_LEVEL = "shop_level",
}

export enum ServiceFeeStatus {
  ACTIVE = "active",
  PENDING = "pending",
  INACTIVE = "inactive",
}

export type ItemEligibilityConfig = {
  include: {
    categories: string[];
    collection: string[];
  };
  exinclude: {
    categories: string[];
    collection: string[];
  };
};

export type ShopEligibilityConfig =
  | {
      vendors: "all";
    }
  | {
      vendors: string[];
      vendor_group?: string[];
    };

export type ServiceFeeEligibilityConfig =
  | ItemEligibilityConfig
  | ShopEligibilityConfig;

export type ServiceFee = InferTypeOf<typeof ServiceFeeModel>;
export type CreateServiceFee = Omit<ServiceFee, "id">;
