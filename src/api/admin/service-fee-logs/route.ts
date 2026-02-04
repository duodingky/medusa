import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SERVICE_FEE_LOG_MODULE } from "../../../modules/service-fee-log";
import ServiceFeeLogModuleService from "../../../modules/service-fee-log/service";
import { ServiceFeeLogAction } from "../../../modules/service-fee-log/types";

const resolveQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const serviceFeeLogService: ServiceFeeLogModuleService = req.scope.resolve(
    SERVICE_FEE_LOG_MODULE
  );

  const action = resolveQueryValue(req.query.action);
  const service_fee_id = resolveQueryValue(req.query.service_fee_id);
  const actor_id = resolveQueryValue(req.query.actor_id);
  const actor_type = resolveQueryValue(req.query.actor_type);

  if (action && !Object.values(ServiceFeeLogAction).includes(action as ServiceFeeLogAction)) {
    return res.status(400).json({ message: "Invalid action filter." });
  }

  const filters: Record<string, string> = {};

  if (action) {
    filters.action = action;
  }

  if (service_fee_id) {
    filters.service_fee_id = service_fee_id;
  }

  if (actor_id) {
    filters.actor_id = actor_id;
  }

  if (actor_type) {
    filters.actor_type = actor_type;
  }

  const service_fee_logs =
    await serviceFeeLogService.listServiceFeeLogs(filters);

  const sortedLogs = [...service_fee_logs].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  return res.status(200).json({ service_fee_logs: sortedLogs });
}
