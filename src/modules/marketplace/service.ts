import { MedusaService } from "@medusajs/framework/utils";
import { Vendor } from "./models/vendor";

class MarketplaceModuleService extends MedusaService({
  Vendor,
}) {}

export default MarketplaceModuleService;
