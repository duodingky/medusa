import { MedusaContainer } from "@medusajs/framework/types";
import { SF_ORDER_MODULE } from "../modules/order-with-sf";
import { CreateSfOrderInput, CreateSfLineItemInput } from "../modules/order-with-sf/types";
import SfOrderModuleService from "../modules/order-with-sf/service";

export const saveOrderWithServiceFee = async (
  order: any,
  scope: MedusaContainer
): Promise<void> => {
  try {
    const sfOrderModuleService: SfOrderModuleService = scope.resolve(
      SF_ORDER_MODULE
    );

    // Prepare order data
    const orderInput: CreateSfOrderInput = {
      order_id: order.id,
      display_id: order.display_id || 0,
      email: order.email || null,
      currency_code: order.currency_code,
      region_id: order.region_id || null,
      customer_id: order.customer_id || null,
      sales_channel_id: order.sales_channel_id || null,
      status: order.status || null,
      total: order.total || 0,
      subtotal: order.subtotal || 0,
      tax_total: order.tax_total || 0,
      discount_total: order.discount_total || 0,
      shipping_total: order.shipping_total || 0,
      service_fee_total: order.service_fee_total || null,
      shipping_address: order.shipping_address || null,
      billing_address: order.billing_address || null,
      metadata: order.metadata || null,
    };

    // Create order record
    const createdOrder = await sfOrderModuleService.createOrderWithSf(
      orderInput
    );

    // Save line items
    if (order.items && Array.isArray(order.items)) {
      const lineItemsInput: CreateSfLineItemInput[] = order.items.map(
        (item: any) => ({
          sf_order_id: createdOrder.id,
          line_item_id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price || 0,
          subtotal: item.subtotal || 0,
          total: item.total || 0,
          tax_total: item.tax_total || null,
          discount_total: item.discount_total || null,
          variant_id: item.variant_id || null,
          product_id: item.product_id || null,
          metadata: item.metadata || null,
        })
      );

      for (const itemInput of lineItemsInput) {
        await sfOrderModuleService.createOrderItemWithSf(itemInput);
      }
    }
  } catch (error) {
    console.error("Error saving order with service fee:", error);
    // Don't throw - we don't want to fail the entire request if saving fails
  }
};
