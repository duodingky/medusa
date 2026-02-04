import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  deleteLineItemsWorkflowId,
  updateLineItemInCartWorkflowId,
} from "@medusajs/core-flows";
import { Modules } from "@medusajs/framework/utils";
import { refetchCart } from "../../../helpers";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const request = req as MedusaRequest & {
    validatedBody: Record<string, unknown> & { additional_data?: unknown };
  };
  const we = request.scope.resolve(Modules.WORKFLOW_ENGINE);
  await we.run(updateLineItemInCartWorkflowId, {
    input: {
      cart_id: request.params.id,
      item_id: request.params.line_id,
      update: request.validatedBody,
      additional_data: request.validatedBody.additional_data,
    },
  });

  const updatedCart = await refetchCart(
    request.params.id,
    request.scope,
    request.queryConfig.fields
  );

  res.status(200).json({ cart: updatedCart });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const request = req as MedusaRequest;
  const id = request.params.line_id;
  const we = request.scope.resolve(Modules.WORKFLOW_ENGINE);
  await we.run(deleteLineItemsWorkflowId, {
    input: {
      cart_id: request.params.id,
      ids: [id],
    },
  });

  const cart = await refetchCart(
    request.params.id,
    request.scope,
    request.queryConfig.fields
  );

  res.status(200).json({
    id,
    object: "line-item",
    deleted: true,
    parent: cart,
  });
}
