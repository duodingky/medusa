import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { getOrderDetailWorkflow } from "@medusajs/core-flows";
import { refetchOrder } from "../../carts/helpers";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const order = await refetchOrder(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  );

  res.status(200).json({ order });
}
