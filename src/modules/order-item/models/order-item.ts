import { model } from "@medusajs/framework/utils";

export const NewOrderItem = model.define("new_order_item", {
  id: model.id().primaryKey(),
  order_id: model.text().nullable(),
  product_id: model.text().nullable(),
  variant_id: model.text().nullable(),
  quantity: model.number().nullable(),
  unit_price: model.bigNumber().nullable(),
  final_price: model.bigNumber().nullable(),
  service_fee_amount: model.bigNumber().nullable(),
  service_fee_rate: model.number().nullable(),
  subtotal: model.bigNumber().nullable(),
  total: model.bigNumber().nullable(),
  vendor_id: model.text().nullable(),
});
