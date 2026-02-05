import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { addToCartWorkflowId } from "@medusajs/core-flows";
import { Modules } from "@medusajs/framework/utils";
import { refetchCart } from "../../helpers";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const request = req as MedusaRequest & {
    validatedBody: Record<string, unknown> & { additional_data?: unknown };
  };
  const we = request.scope.resolve(Modules.WORKFLOW_ENGINE);
  await we.run(addToCartWorkflowId, {
    input: {
      cart_id: request.params.id,
      items: [request.validatedBody],
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
