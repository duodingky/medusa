import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { transferCartCustomerWorkflowId } from "@medusajs/core-flows";
import { Modules } from "@medusajs/framework/utils";
import { refetchCart } from "../../helpers";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const request = req as MedusaRequest & {
    validatedBody: Record<string, unknown> & { additional_data?: unknown };
    auth_context?: { actor_id?: string };
  };
  const we = request.scope.resolve(Modules.WORKFLOW_ENGINE);
  await we.run(transferCartCustomerWorkflowId, {
    input: {
      id: request.params.id,
      customer_id: request.auth_context?.actor_id,
      additional_data: request.validatedBody.additional_data,
    },
  });

  const cart = await refetchCart(
    request.params.id,
    request.scope,
    request.queryConfig.fields
  );

  res.status(200).json({ cart });
}
