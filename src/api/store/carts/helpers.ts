import { MedusaContainer } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import { applyServiceFeesToCart } from "../../../utils/service-fee";

export const refetchCart = async (
  id: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const requiredFields = [
    "items.unit_price",
    "items.quantity",
    "items.product_id",
    "items.product.id",
    "items.variant.product_id",
    "items.variant.product.id",
    "shipping_total",
    "shipping_subtotal",
    "shipping_methods.amount",
  ];
  const cartFields = Array.from(new Set([...(fields ?? []), ...requiredFields]));
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "cart",
    variables: { filters: { id } },
    fields: cartFields,
  });

  const [cart] = await remoteQuery(queryObject);

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Cart with id '${id}' not found`
    );
  }

  await applyServiceFeesToCart(scope, cart);

  return cart;
};
