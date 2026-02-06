import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SF_ORDER_MODULE } from "../../../modules/sf-order";
import SfOrderModuleService from "../../../modules/sf-order/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const sfOrderService: SfOrderModuleService = req.scope.resolve(SF_ORDER_MODULE);
  
  const [orders, count] = await sfOrderService.listAndCountSfOrders(
    {},
    {
      select: [
        "id",
        "order_id",
        "display_id",
        "email",
        "currency_code",
        "status",
        "total",
        "subtotal",
        "service_fee_total",
        "created_at",
      ],
      order: {
        created_at: "DESC",
      },
    }
  );

  return res.status(200).json({ orders, count });
}
