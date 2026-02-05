import { createPaymentCollectionForCartWorkflowId, createPaymentSessionsWorkflow } from "@medusajs/core-flows";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import { defaultStoreCartFields } from "@medusajs/medusa/api/store/carts/query-config";
import { refetchCart } from "../../helpers";

type PaymentSessionRequestBody = {
  provider_id: string;
  data?: Record<string, unknown>;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const request = req as MedusaRequest & {
    validatedBody: PaymentSessionRequestBody;
    auth_context?: { actor_id?: string };
  };
  const cartId = request.params.id;
  const remoteQuery = request.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const fields = request.queryConfig?.fields ?? defaultStoreCartFields;

  const fetchPaymentCollectionId = async () => {
    const [cartCollectionRelation] = await remoteQuery(
      remoteQueryObjectFromString({
        entryPoint: "cart_payment_collection",
        variables: { filters: { cart_id: cartId } },
        fields: ["payment_collection.id"],
      })
    );

    return cartCollectionRelation?.payment_collection?.id;
  };

  let paymentCollectionId = await fetchPaymentCollectionId();

  if (!paymentCollectionId) {
    const we = request.scope.resolve(Modules.WORKFLOW_ENGINE);
    await we.run(createPaymentCollectionForCartWorkflowId, {
      input: { cart_id: cartId },
    });
    paymentCollectionId = await fetchPaymentCollectionId();
  }

  if (!paymentCollectionId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment collection for cart '${cartId}' not found`
    );
  }

  await createPaymentSessionsWorkflow(request.scope).run({
    input: {
      payment_collection_id: paymentCollectionId,
      provider_id: request.validatedBody.provider_id,
      customer_id: request.auth_context?.actor_id,
      data: request.validatedBody.data,
    },
  });

  const cart = await refetchCart(cartId, request.scope, fields);

  res.status(200).json({ cart });
}
