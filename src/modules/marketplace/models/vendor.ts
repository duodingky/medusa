import { model } from "@medusajs/framework/utils";

export const Vendor = model.define("vendor", {
  id: model.id().primaryKey(),
  handle: model.text(),
  name: model.text(),
  email: model.text().nullable(),
  phone: model.text().nullable(),
  description: model.text().nullable(),
  is_active: model.boolean().default(true),
});
