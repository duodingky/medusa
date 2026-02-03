import { model } from "@medusajs/framework/utils";

export const VendorGroup = model.define("vendor_group", {
  id: model.id().primaryKey(),
  name: model.text().unique(),
});
