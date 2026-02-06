import { MedusaService } from "@medusajs/framework/utils";
import { OrderWithSf } from "./models/order-with-sf";
import { OrderItemWithSf } from "./models/order-item-with-sf";

class SfOrderModuleService extends MedusaService({
  OrderWithSf,
  OrderItemWithSf,
}) {}

export default SfOrderModuleService;
