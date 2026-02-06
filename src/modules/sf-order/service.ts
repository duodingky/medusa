import { MedusaService } from "@medusajs/framework/utils";
import { SfOrder } from "./models/sf-order";
import { SfLineItem } from "./models/sf-line-item";

class SfOrderModuleService extends MedusaService({
  SfOrder,
  SfLineItem,
}) {}

export default SfOrderModuleService;
