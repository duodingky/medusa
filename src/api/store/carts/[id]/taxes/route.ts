import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { updateTaxLinesWorkflow } from "@medusajs/core-flows";
import { refetchCart } from "../../helpers";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await updateTaxLinesWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      force_tax_calculation: true,
    },
  });

  const cart = await refetchCart(req.params.id, req.scope, req.queryConfig.fields);

  res.status(200).json({ cart });
}
