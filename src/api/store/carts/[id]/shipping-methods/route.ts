import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { addShippingMethodToCartWorkflow } from "@medusajs/core-flows";
import { refetchCart } from "../../helpers";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const request = req as MedusaRequest & {
    validatedBody: { option_id: string; data?: Record<string, unknown> };
  };
  const payload = request.validatedBody;

  await addShippingMethodToCartWorkflow(request.scope).run({
    input: {
      options: [{ id: payload.option_id, data: payload.data }],
      cart_id: request.params.id,
      additional_data: (payload as { additional_data?: unknown }).additional_data,
    },
  });

  const cart = await refetchCart(
    request.params.id,
    request.scope,
    request.queryConfig.fields
  );

  res.status(200).json({ cart });
}
