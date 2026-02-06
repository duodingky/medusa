import { InferTypeOf } from "@medusajs/framework/types";
import { OrderWithSf as OrderWithSfModel } from "../models/order-with-sf";
import { OrderItemWithSf as OrderItemWithSfModel } from "../models/order-item-with-sf";

export interface CreateSfOrderInput {
  order_id: string;
  display_id: number;
  email?: string | null;
  currency_code: string;
  region_id?: string | null;
  customer_id?: string | null;
  sales_channel_id?: string | null;
  status?: string | null;
  total: number | string;
  subtotal: number | string;
  tax_total: number | string;
  discount_total: number | string;
  shipping_total: number | string;
  service_fee_total?: number | string | null;
  shipping_address?: any;
  billing_address?: any;
  metadata?: Record<string, any> | null;
}

export interface CreateSfLineItemInput {
  sf_order_id: string;
  line_item_id: string;
  title: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
  total: number | string;
  tax_total?: number | string | null;
  discount_total?: number | string | null;
  variant_id?: string | null;
  product_id?: string | null;
  metadata?: Record<string, any> | null;
}

export type OrderWithSf = InferTypeOf<typeof OrderWithSfModel>;
export type OrderItemWithSf = InferTypeOf<typeof OrderItemWithSfModel>;
