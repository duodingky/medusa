import { model } from "@medusajs/framework/utils";
import { ServiceFeeLogAction } from "../types";

export const ServiceFeeLog = model.define("service_fee_logs", {
  id: model.id().primaryKey(),
  service_fee_id: model.text(),
  action: model.enum(ServiceFeeLogAction),
  note: model.text(),
  actor_id: model.text().nullable(),
  actor_type: model.text().nullable(),
});
