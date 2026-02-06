import { model } from "@medusajs/framework/utils";

export const OrderWithSf = model.define("order_with_sf", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  display_id: model.number(),
  email: model.text().nullable(),
  currency_code: model.text(),
  region_id: model.text().nullable(),
  customer_id: model.text().nullable(),
  sales_channel_id: model.text().nullable(),
  status: model.text().nullable(),
  total: model.bigNumber(),
  subtotal: model.bigNumber(),
  tax_total: model.bigNumber(),
  discount_total: model.bigNumber(),
  shipping_total: model.bigNumber(),
  service_fee_total: model.bigNumber().nullable(),
  shipping_address: model.json().nullable(),
  billing_address: model.json().nullable(),
  metadata: model.json().nullable(),
  created_at: model.dateTime(),
});
