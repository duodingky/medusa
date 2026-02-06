import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { ORDER_ITEM_MODULE } from "../../../../modules/order-item";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderId = req.params.id;

  try {
    const orderItemService = req.scope.resolve(ORDER_ITEM_MODULE);

    const orderItems = await orderItemService.list({
      order_id: orderId,
    });

    // Calculate aggregates
    let totalQuantity = 0;
    let totalSubtotal = 0;
    let totalServiceFees = 0;
    let totalAmount = 0;

    if (orderItems && orderItems.length > 0) {
      orderItems.forEach((item: any) => {
        totalQuantity += Number(item.quantity || 0);
        totalSubtotal += Number(item.subtotal || 0);
        totalServiceFees += Number(item.service_fee_amount || 0);
        totalAmount += Number(item.total || 0);
      });
    }

    // Format items for response
    const formattedItems = (orderItems || []).map((item: any) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: Number(item.unit_price || 0),
      final_price: Number(item.final_price || 0),
      service_fee_amount: Number(item.service_fee_amount || 0),
      service_fee_rate: item.service_fee_rate,
      subtotal: Number(item.subtotal || 0),
      total: Number(item.total || 0),
      vendor_id: item.vendor_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    res.status(200).json({
      order_items: formattedItems,
      summary: {
        total_items: formattedItems.length,
        total_quantity: totalQuantity,
        subtotal: totalSubtotal,
        service_fees_total: totalServiceFees,
        grand_total: totalAmount,
      },
    });
  } catch (error) {
    console.error("Error fetching order items:", error);
    res.status(500).json({ error: "Failed to fetch order items" });
  }
}
