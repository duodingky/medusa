import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SF_ORDER_MODULE } from "../../../../modules/sf-order";
import SfOrderModuleService from "../../../../modules/sf-order/service";
import { SERVICE_FEE_LOG_MODULE } from "../../../../modules/service-fee-log";
import ServiceFeeLogModuleService from "../../../../modules/service-fee-log/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const sfOrderService: SfOrderModuleService = req.scope.resolve(SF_ORDER_MODULE);
  const serviceFeeLogService: ServiceFeeLogModuleService = req.scope.resolve(SERVICE_FEE_LOG_MODULE);

  // Get the order
  const order = await sfOrderService.retrieveSfOrder(id, {
    select: [
      "id",
      "order_id",
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
      "service_fee_total",
      "shipping_address",
      "billing_address",
      "metadata",
      "created_at",
      "updated_at",
    ],
  });

  // Get line items for this order
  const lineItems = await sfOrderService.listSfLineItems({
    sf_order_id: id,
  }, {
    select: [
      "id",
      "line_item_id",
      "title",
      "quantity",
      "unit_price",
      "subtotal",
      "total",
      "tax_total",
      "discount_total",
      "variant_id",
      "product_id",
      "metadata",
    ],
  });

  // Get service fees related to this order
  // We'll match by order_id from the original order
  let serviceFees: any[] = [];
  try {
    const { data: fees } = await query.graph({
      entity: "service_fee_logs",
      fields: [
        "id",
        "service_fee_id",
        "fee_name",
        "rate",
        "charging_level",
        "status",
        "date_added",
      ],
      filters: {
        // You might need to adjust this filter based on how you link service fees to orders
        // For now, we'll get recent service fees as an example
      },
      pagination: {
        take: 10,
        order: {
          date_added: "DESC",
        },
      },
    });
    serviceFees = fees || [];
  } catch (error) {
    console.error("Error fetching service fees:", error);
  }

  return res.status(200).json({
    order: {
      ...order,
      line_items: lineItems,
      service_fees: serviceFees,
    },
  });
}
