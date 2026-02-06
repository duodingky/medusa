import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SF_ORDER_MODULE } from "../modules/sf-order";

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id;

  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const sfOrderService = container.resolve(SF_ORDER_MODULE);

  // Fetch the complete order details
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "region_id",
      "customer_id",
      "sales_channel_id",
      "status",
      "total",
      "subtotal",
      "tax_total",
      "discount_total",
      "shipping_total",
      "shipping_address.*",
      "billing_address.*",
      "metadata",
      "items.*",
      "items.tax_lines.*",
      "items.adjustments.*",
    ],
    filters: {
      id: orderId,
    },
  });

  if (!orders || orders.length === 0) {
    console.error(`Order with id ${orderId} not found`);
    return;
  }

  const order = orders[0];

  // Calculate service fee total from metadata or other sources
  const serviceFeeTotal = order.metadata?.service_fee_total || 0;

  // Create the sf_order record
  const sfOrder = await sfOrderService.createSfOrders({
    order_id: order.id,
    display_id: order.display_id,
    email: order.email,
    currency_code: order.currency_code,
    region_id: order.region_id,
    customer_id: order.customer_id,
    sales_channel_id: order.sales_channel_id,
    status: order.status,
    total: order.total,
    subtotal: order.subtotal,
    tax_total: order.tax_total,
    discount_total: order.discount_total,
    shipping_total: order.shipping_total,
    service_fee_total: serviceFeeTotal,
    shipping_address: order.shipping_address,
    billing_address: order.billing_address,
    metadata: order.metadata,
  });

  // Create sf_line_item records
  if (order.items && order.items.length > 0) {
    const lineItemsToCreate = order.items.map((item: any) => ({
      sf_order_id: sfOrder.id,
      line_item_id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      total: item.total,
      tax_total: item.tax_total,
      discount_total: item.discount_total,
      variant_id: item.variant_id,
      product_id: item.product_id,
      metadata: item.metadata,
    }));

    await sfOrderService.createSfLineItems(lineItemsToCreate);
  }

  console.log(`Order ${orderId} saved to sf_order and sf_line_item tables`);
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
