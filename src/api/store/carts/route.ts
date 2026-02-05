import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createCartWorkflow } from "@medusajs/core-flows";
import { refetchCart } from "./helpers";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const request = req as MedusaRequest & {
    validatedBody: Record<string, unknown>;
    auth_context?: { actor_id?: string };
  };
  const workflowInput = {
    ...request.validatedBody,
    customer_id: request.auth_context?.actor_id,
  };
  const { result } = await createCartWorkflow(request.scope).run({
    input: workflowInput,
  });
  const cart = await refetchCart(result.id, request.scope, request.queryConfig.fields);

  res.status(200).json({ cart });
}
