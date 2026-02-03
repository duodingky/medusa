import Service from "./service";
import { Module } from "@medusajs/framework/utils";

export const VENDOR_GROUP_MODULE = "vendor_group";

export default Module(VENDOR_GROUP_MODULE, {
  service: Service,
});
