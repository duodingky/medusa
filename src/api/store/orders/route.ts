import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { getOrdersListWorkflow } from "@medusajs/core-flows";
import { applyServiceFeesToCart } from "../../../utils/service-fee";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const workflow = getOrdersListWorkflow(req.scope);
  const { result } = await workflow.run({
    input: {
      fields: req.queryConfig.fields,
      variables: {
        ...req.filterableFields,
        is_draft_order: false,
        customer_id: req.auth_context.actor_id,
      },
      ...req.queryConfig.pagination,
    },
  });

  const { rows, metadata } = result;

  // Apply service fees to each order
  await Promise.all(
    rows.map((order) => applyServiceFeesToCart(req.scope, order))
  );

  res.json({
    orders: rows,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  });
}
