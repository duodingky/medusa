import { model } from "@medusajs/framework/utils";
import { ChargingLevel, ServiceFeeStatus } from "../types";

export const ServiceFee = model.define("servcie_fee", {
  id: model.id().primaryKey(),
  display_name: model.text(),
  fee_name: model.text(),
  charging_level: model.enum(ChargingLevel),
  rate: model.number(),
  eligibility_config: model.json().nullable(),
  valid_from: model.dateTime().nullable(),
  valid_to: model.dateTime().nullable(),
  status: model.enum(ServiceFeeStatus).default(ServiceFeeStatus.PENDING),
  date_created: model.dateTime(),
});
