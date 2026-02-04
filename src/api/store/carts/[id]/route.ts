import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { updateCartWorkflowId } from "@medusajs/core-flows";
import { Modules } from "@medusajs/framework/utils";
import { refetchCart } from "../helpers";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cart = await refetchCart(req.params.id, req.scope, req.queryConfig.fields);

  res.json({ cart });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE);
  const request = req as MedusaRequest & {
    validatedBody: Record<string, unknown>;
  };
  await we.run(updateCartWorkflowId, {
    input: {
      ...request.validatedBody,
      id: request.params.id,
      additional_data: (request.validatedBody as { additional_data?: unknown })
        .additional_data,
    },
  });

  const cart = await refetchCart(
    request.params.id,
    request.scope,
    request.queryConfig.fields
  );

  res.status(200).json({ cart });
}
