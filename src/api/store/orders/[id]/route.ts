import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { applyServiceFeesToOrder } from "../../../../utils/service-fee";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderId = req.params.id;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const requiredOrderFields = [
    "items.unit_price",
    "items.quantity",
    "items.product_id",
    "items.product.id",
    "items.variant.product_id",
    "items.variant.product.id",
    "shipping_total",
    "shipping_subtotal",
    "shipping_methods.amount",
  ];
  const orderFields = Array.from(
    new Set([...(req.queryConfig?.fields ?? []), ...requiredOrderFields])
  );

  const { data } = await query.graph({
    entity: "order",
    fields: orderFields,
    filters: { id: orderId },
  });
  const order = data?.[0];

  if (!order) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order with id '${orderId}' not found`
    );
  }

  await applyServiceFeesToOrder(req.scope, order);

  res.status(200).json({ order });
}
