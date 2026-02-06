import { MedusaService } from "@medusajs/framework/utils";
import { NewOrderItem } from "./models/order-item";

class OrderItemModuleService extends MedusaService({
  NewOrderItem,
}) {}

export default OrderItemModuleService;
