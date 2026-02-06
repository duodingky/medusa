import Service from "./service";
import { Module } from "@medusajs/framework/utils";

export const ORDER_ITEM_MODULE = "new_order_item";

export default Module(ORDER_ITEM_MODULE, {
  service: Service,
});
