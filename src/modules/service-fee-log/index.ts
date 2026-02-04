import Service from "./service";
import { Module } from "@medusajs/framework/utils";

export const SERVICE_FEE_LOG_MODULE = "service_fee_log";

export default Module(SERVICE_FEE_LOG_MODULE, {
  service: Service,
});
