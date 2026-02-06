import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { enrichOrderWithServiceFees, formatOrderForAdmin } from "./helpers";
import { defaultAdminOrderFields } from "./query-config";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    limit = 20,
    offset = 0,
    status,
    customer_id,
    created_at_from,
    created_at_to,
  } = req.query;

  // Build filters
  const filters: any = {};

  if (status) {
    filters.status = status;
  }

  if (customer_id) {
    filters.customer_id = customer_id;
  }

  if (created_at_from || created_at_to) {
    filters.created_at = {};
    if (created_at_from) {
      filters.created_at.$gte = new Date(created_at_from as string);
    }
    if (created_at_to) {
      filters.created_at.$lte = new Date(created_at_to as string);
    }
  }

  try {
    const { data, metadata } = await query.graph({
      entity: "order",
      fields: defaultAdminOrderFields,
      filters,
      pagination: {
        take: Number(limit),
        skip: Number(offset),
      },
    });

    // Enrich orders with service fees
    const enrichedOrders = await Promise.all(
      (data || []).map((order: any) =>
        enrichOrderWithServiceFees(order, req.scope)
      )
    );

    // Format for response
    const formattedOrders = enrichedOrders.map(formatOrderForAdmin);

    res.status(200).json({
      orders: formattedOrders,
      count: metadata?.count || 0,
      offset: Number(offset),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}
