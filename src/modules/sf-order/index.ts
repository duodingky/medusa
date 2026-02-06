import Service from "./service";
import { Module } from "@medusajs/framework/utils";

export const SF_ORDER_MODULE = "sf_order";

export default Module(SF_ORDER_MODULE, {
  service: Service,
});
