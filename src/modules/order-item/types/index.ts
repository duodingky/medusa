import { InferTypeOf } from "@medusajs/framework/types";
import { NewOrderItem } from "../models/order-item";

export type CreateOrderItem = Omit<InferTypeOf<typeof NewOrderItem>, "id">;
export type UpdateOrderItem = Partial<CreateOrderItem>;
