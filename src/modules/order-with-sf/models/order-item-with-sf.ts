import { model } from "@medusajs/framework/utils";

export const OrderItemWithSf = model.define("order_item_with_sf", {
  id: model.id().primaryKey(),
  sf_order_id: model.text(),
  line_item_id: model.text(),
  title: model.text(),
  quantity: model.number(),
  unit_price: model.bigNumber(),
  subtotal: model.bigNumber(),
  total: model.bigNumber(),
  tax_total: model.bigNumber().nullable(),
  discount_total: model.bigNumber().nullable(),
  variant_id: model.text().nullable(),
  product_id: model.text().nullable(),
  metadata: model.json().nullable(),
  created_at: model.dateTime(),
});
