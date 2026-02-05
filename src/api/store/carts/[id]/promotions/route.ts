import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { updateCartPromotionsWorkflowId } from "@medusajs/core-flows";
import { Modules, PromotionActions } from "@medusajs/framework/utils";
import { refetchCart } from "../../helpers";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const request = req as MedusaRequest & {
    validatedBody: { promo_codes: string[] };
  };
  const we = request.scope.resolve(Modules.WORKFLOW_ENGINE);
  const payload = request.validatedBody;

  await we.run(updateCartPromotionsWorkflowId, {
    input: {
      promo_codes: payload.promo_codes,
      cart_id: request.params.id,
      action:
        payload.promo_codes.length > 0
          ? PromotionActions.ADD
          : PromotionActions.REPLACE,
      force_refresh_payment_collection: true,
    },
  });

  const cart = await refetchCart(
    request.params.id,
    request.scope,
    request.queryConfig.fields
  );

  res.status(200).json({ cart });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const request = req as MedusaRequest & {
    validatedBody: { promo_codes: string[] };
  };
  const we = request.scope.resolve(Modules.WORKFLOW_ENGINE);
  const payload = request.validatedBody;

  await we.run(updateCartPromotionsWorkflowId, {
    input: {
      promo_codes: payload.promo_codes,
      cart_id: request.params.id,
      action: PromotionActions.REMOVE,
      force_refresh_payment_collection: true,
    },
  });

  const cart = await refetchCart(
    request.params.id,
    request.scope,
    request.queryConfig.fields
  );

  res.status(200).json({ cart });
}
