import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  createPaymentCollectionForCartWorkflowId,
  createPaymentSessionsWorkflow,
} from "@medusajs/core-flows";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import { prepareRetrieveQuery } from "@medusajs/framework";
import { defaultStoreCartFields } from "@medusajs/medusa/api/store/carts/query-config";
import { refetchCart } from "../../helpers";

type CreatePaymentSessionBody = {
  provider_id: string;
  data?: Record<string, unknown>;
};

const fetchCartPaymentCollectionId = async (
  req: MedusaRequest,
  cartId: string
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const [relation] = await remoteQuery(
    remoteQueryObjectFromString({
      entryPoint: "cart_payment_collection",
      variables: { filters: { cart_id: cartId } },
      fields: ["payment_collection.id"],
    })
  );

  return relation?.payment_collection?.id as string | undefined;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const request = req as MedusaRequest & { body: CreatePaymentSessionBody };
  const cartId = request.params.id;
  const { provider_id, data } = request.body ?? {};

  if (!provider_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "provider_id is required"
    );
  }

  let paymentCollectionId = await fetchCartPaymentCollectionId(request, cartId);

  if (!paymentCollectionId) {
    const workflowEngine = request.scope.resolve(Modules.WORKFLOW_ENGINE);
    await workflowEngine.run(createPaymentCollectionForCartWorkflowId, {
      input: { cart_id: cartId },
    });
    paymentCollectionId = await fetchCartPaymentCollectionId(request, cartId);
  }

  if (!paymentCollectionId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Payment collection for cart not found."
    );
  }

  await createPaymentSessionsWorkflow(request.scope).run({
    input: {
      payment_collection_id: paymentCollectionId,
      provider_id,
      customer_id: request.auth_context?.actor_id,
      data,
    },
  });

  const cart = await refetchCart(
    cartId,
    request.scope,
    prepareRetrieveQuery(
      {},
      {
        defaults: defaultStoreCartFields,
      }
    ).remoteQueryConfig.fields
  );

  res.status(200).json({ cart });
}
