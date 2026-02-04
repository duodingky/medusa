import { InferTypeOf } from "@medusajs/framework/types";
import { ServiceFeeLog as ServiceFeeLogModel } from "../models/service-fee-log";

export enum ServiceFeeLogAction {
  ADDED = "added",
  UPDATED = "updated",
  DELETED = "deleted",
}

export type ServiceFeeLog = InferTypeOf<typeof ServiceFeeLogModel>;
export type CreateServiceFeeLog = Omit<ServiceFeeLog, "id">;
