import { ORDER_ITEM_MODULE } from "../../../modules/order-item";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function enrichOrderWithServiceFees(order: any, scope: any) {
  if (!order || !order.id) {
    return order;
  }

  try {
    const orderItemService = scope.resolve(ORDER_ITEM_MODULE);
    const orderItems = await orderItemService.list({
      order_id: order.id,
    });

    // Calculate service fee totals
    let totalServiceFees = 0;
    let itemsSubtotal = 0;

    if (orderItems && orderItems.length > 0) {
      orderItems.forEach((item: any) => {
        totalServiceFees += Number(item.service_fee_amount || 0);
        itemsSubtotal += Number(item.subtotal || 0);
      });

      // Attach order items and calculated totals to order
      order.order_items = orderItems;
      order.service_fees_total = totalServiceFees;
      order.items_subtotal = itemsSubtotal;
    }
  } catch (error) {
    console.error("Error enriching order with service fees:", error);
    // Don't fail the response if service fee enrichment fails
  }

  return order;
}

export function formatOrderForAdmin(order: any) {
  return {
    id: order.id,
    display_id: order.display_id,
    status: order.status,
    created_at: order.created_at,
    customer_email: order.customer?.email || order.email,
    customer_name: order.customer
      ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim()
      : "",
    subtotal: order.subtotal,
    items_subtotal: order.items_subtotal || order.subtotal,
    shipping_total: order.shipping_total || 0,
    service_fees_total: order.service_fees_total || 0,
    total: order.total,
    currency_code: order.currency_code,
    items_count: order.items?.length || 0,
    order_items: order.order_items || [],
  };
}

export function calculateOrderTotals(order: any) {
  const shippingTotal = Number(order.shipping_total || 0);
  const serviceFeeTotal = Number(order.service_fees_total || 0);
  const itemsSubtotal = Number(order.items_subtotal || order.subtotal || 0);

  return {
    items_subtotal: itemsSubtotal,
    service_fees_total: serviceFeeTotal,
    shipping_total: shippingTotal,
    total: itemsSubtotal + serviceFeeTotal + shippingTotal,
  };
}
