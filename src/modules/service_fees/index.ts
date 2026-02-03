import ServiceFeesModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const SERVICE_FEES_MODULE = "serviceFeesModuleService"

export default Module(SERVICE_FEES_MODULE, {
  service: ServiceFeesModuleService,
})