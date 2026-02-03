import Service from "./service";
import { Module } from "@medusajs/framework/utils";

export const SERVICE_FEE_MODULE = "service_fee";

export default Module(SERVICE_FEE_MODULE, {
  service: Service,
});
