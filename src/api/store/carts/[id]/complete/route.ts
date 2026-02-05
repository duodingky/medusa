import { prepareRetrieveQuery } from "@medusajs/framework";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { completeCartWorkflowId } from "@medusajs/core-flows";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { refetchCart } from "../../helpers";
import { defaultStoreCartFields } from "@medusajs/medusa/api/store/carts/query-config";
import { applyServiceFeesToOrder } from "../../../../../utils/service-fee";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cart_id = req.params.id;
  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE);
  const { errors, result, transaction } = await we.run(completeCartWorkflowId, {
    input: { id: cart_id },
    throwOnError: false,
  });

  if (!transaction.hasFinished()) {
    throw new MedusaError(
      MedusaError.Types.CONFLICT,
      "Cart is already being completed by another request"
    );
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  if (errors?.[0]) {
    const error = errors[0].error;
    const statusOKErrors = [
      MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
      MedusaError.Types.PAYMENT_REQUIRES_MORE_ERROR,
    ];

    const cart = await refetchCart(
      cart_id,
      req.scope,
      prepareRetrieveQuery(
        {},
        {
          defaults: defaultStoreCartFields,
        }
      ).remoteQueryConfig.fields
    );

    if (!statusOKErrors.includes(error?.type)) {
      throw error;
    }

    res.status(200).json({
      type: "cart",
      cart,
      error: {
        message: error.message,
        name: error.name,
        type: error.type,
      },
    });
    return;
  }

  const requiredOrderFields = [
    "items.unit_price",
    "items.quantity",
    "items.product_id",
    "shipping_total",
    "shipping_methods.amount",
  ];
  const orderFields = Array.from(
    new Set([...(req.queryConfig.fields ?? []), ...requiredOrderFields])
  );

  const { data } = await query.graph({
    entity: "order",
    fields: orderFields,
    filters: { id: result.id },
  });
  const order = data[0];
  if (order) {
    await applyServiceFeesToOrder(req.scope, order);
  }

  res.status(200).json({
    type: "order",
    order,
  });
}
