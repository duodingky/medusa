import { MedusaService } from "@medusajs/framework/utils";
import { ServiceFee } from "./models/service-fee";

class ServiceFeeModuleService extends MedusaService({
  ServiceFee,
}) {}

export default ServiceFeeModuleService;
