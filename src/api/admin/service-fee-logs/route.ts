import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SERVICE_FEE_LOG_MODULE } from "../../../modules/service-fee-log";
import ServiceFeeLogModuleService from "../../../modules/service-fee-log/service";

const resolveQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const serviceFeeLogService: ServiceFeeLogModuleService = req.scope.resolve(
    SERVICE_FEE_LOG_MODULE
  );

  const user = resolveQueryValue(req.query.user);
  const display_name = resolveQueryValue(req.query.display_name);
  const fee_name = resolveQueryValue(req.query.fee_name);
  const charging_level = resolveQueryValue(req.query.charging_level);
  const status = resolveQueryValue(req.query.status);
  const service_fee_id = resolveQueryValue(req.query.service_fee_id);

  const filters: Record<string, string> = {};

  if (user) {
    filters.user = user;
  }

  if (display_name) {
    filters.display_name = display_name;
  }

  if (fee_name) {
    filters.fee_name = fee_name;
  }

  if (charging_level) {
    filters.charging_level = charging_level;
  }

  if (status) {
    filters.status = status;
  }

  if (service_fee_id) {
    filters.service_fee_id = service_fee_id;
  }

  const service_fee_logs =
    await serviceFeeLogService.listServiceFeeLogs(filters);

  const sortedLogs = [...service_fee_logs].sort((a, b) => {
    const aSource = a.date_added ?? a.created_at;
    const bSource = b.date_added ?? b.created_at;
    const aTime = aSource ? new Date(aSource).getTime() : 0;
    const bTime = bSource ? new Date(bSource).getTime() : 0;
    return bTime - aTime;
  });

  return res.status(200).json({ service_fee_logs: sortedLogs });
}
