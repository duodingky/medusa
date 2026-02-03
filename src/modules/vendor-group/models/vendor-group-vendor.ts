import { model } from "@medusajs/framework/utils";

export const VendorGroupVendor = model.define("vendor_group_vendor", {
  id: model.id().primaryKey(),
  vendor_group_id: model.text(),
  vendor_id: model.text(),
});
