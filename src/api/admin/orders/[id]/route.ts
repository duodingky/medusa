import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { enrichOrderWithServiceFees, formatOrderForAdmin, calculateOrderTotals } from "../helpers";
import { defaultAdminOrderFields } from "../query-config";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const orderId = req.params.id;

  try {
    const { data } = await query.graph({
      entity: "order",
      fields: defaultAdminOrderFields,
      filters: { id: orderId },
    });

    if (!data || data.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order with id '${orderId}' not found`
      );
    }

    // Enrich with service fees
    let order = data[0];
    order = await enrichOrderWithServiceFees(order, req.scope);

    // Calculate totals
    const totals = calculateOrderTotals(order);

    // Format response
    const response = {
      ...formatOrderForAdmin(order),
      ...totals,
      order_items: order.order_items || [],
      items: order.items || [],
      shipping_address: order.shipping_address,
      shipping_methods: order.shipping_methods || [],
      payment_collections: order.payment_collections || [],
      fulfillments: order.fulfillments || [],
    };

    res.status(200).json({ order: response });
  } catch (error) {
    if (error instanceof MedusaError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  }
}
