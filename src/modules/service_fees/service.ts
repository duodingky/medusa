import { MedusaService } from "@medusajs/utils"
import ServiceFees from "./models/service-fees"

class ServiceFeesModuleService extends MedusaService({
  ServiceFee: ServiceFees, 
}) {}
    
export default ServiceFeesModuleService