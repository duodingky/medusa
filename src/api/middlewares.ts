import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework";
import { authenticate, defineMiddlewares } from "@medusajs/medusa";
import * as storeCartQueryConfig from "@medusajs/medusa/api/store/carts/query-config";
import { StoreGetCartsCart } from "@medusajs/medusa/api/store/carts/validators";
import { StoreCreatePaymentSession } from "@medusajs/medusa/api/store/payment-collections/validators";
import * as storeRegionQueryConfig from "@medusajs/medusa/api/store/regions/query-config";
import { StoreGetRegionsParams } from "@medusajs/medusa/api/store/regions/validators";
import deliveriesMiddlewares from "./deliveries/[id]/middlewares";

export default defineMiddlewares({
  routes: [
    {
      method: ["POST"],
      matcher: "/users",
      middlewares: [
        authenticate(["driver", "restaurant"], "bearer", {
          allowUnregistered: true,
        }),
      ],
    },
    {
      method: ["POST", "DELETE"],
      matcher: "/restaurants/:id/**",
      middlewares: [
        authenticate(["restaurant", "user"], "bearer"),
      ],
    },
    {
      method: ["POST"],
      matcher: "/store/carts/:id/payment-sessions",
      middlewares: [
        validateAndTransformBody(StoreCreatePaymentSession),
        validateAndTransformQuery(
          StoreGetCartsCart,
          storeCartQueryConfig.retrieveTransformQueryConfig
        ),
      ],
    },
    {
      method: ["GET"],
      matcher: "/store/regions",
      middlewares: [
        validateAndTransformQuery(
          StoreGetRegionsParams,
          storeRegionQueryConfig.listTransformQueryConfig
        ),
      ],
    },
    ...deliveriesMiddlewares.routes!
  ],
})