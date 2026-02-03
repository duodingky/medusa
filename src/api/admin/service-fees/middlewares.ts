// src/api/admin/service-fees/middlewares.ts
import { MiddlewaresConfig } from "@medusajs/framework/http"
import { validateAndTransformBody } from "@medusajs/framework/http"
import { 
  CreateServiceFeeSchema, 
  UpdateServiceFeeSchema 
} from "./validators"

export const adminServiceFeesMiddlewares: MiddlewaresConfig = {
  routes: [ 
    {
      method: ["POST"],
      matcher: "/admin/service-fees",
      middlewares: [
        validateAndTransformBody(CreateServiceFeeSchema),
      ],
    },
    {
      method: ["PATCH"],
      matcher: "/admin/service-fees/:id",
      middlewares: [
        validateAndTransformBody(UpdateServiceFeeSchema),
      ],
    },
  ],
}