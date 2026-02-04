import { model } from "@medusajs/framework/utils";

export const ServiceFeeLog = model.define("service_fee_logs", {
  id: model.number().primaryKey(),
  service_fee_id: model.text(),
  user: model.text().nullable(),
  display_name: model.text().nullable(),
  fee_name: model.text().nullable(),
  charging_level: model.text().nullable(),
  rate: model.number().nullable(),
  valid_from: model.dateTime().nullable(),
  valid_to: model.dateTime().nullable(),
  status: model.text().nullable(),
  eligibility_config: model.json().nullable(),
  date_added: model.dateTime(),
});
