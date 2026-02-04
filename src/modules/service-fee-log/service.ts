import { MedusaService } from "@medusajs/framework/utils";
import { ServiceFeeLog } from "./models/service-fee-log";

class ServiceFeeLogModuleService extends MedusaService({
  ServiceFeeLog,
}) {}

export default ServiceFeeLogModuleService;
