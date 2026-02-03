import { MedusaService } from "@medusajs/framework/utils";
import { VendorGroup } from "./models/vendor-group";
import { VendorGroupVendor } from "./models/vendor-group-vendor";

class VendorGroupModuleService extends MedusaService({
  VendorGroup,
  VendorGroupVendor,
}) {}

export default VendorGroupModuleService;
