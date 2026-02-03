import Service from "./service";
import { Module } from "@medusajs/framework/utils";

export const MARKETPLACE_MODULE = "marketplace";

export default Module(MARKETPLACE_MODULE, {
  service: Service,
});
