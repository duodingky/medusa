import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SERVICE_FEE_MODULE } from "../../../../modules/service-fee";
import ServiceFeeModuleService from "../../../../modules/service-fee/service";
import { updateServiceFeeSchema } from "../validation-schemas";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const serviceFeeModuleService: ServiceFeeModuleService = req.scope.resolve(
    SERVICE_FEE_MODULE
  );

  const service_fee = await serviceFeeModuleService.retrieveServiceFee(
    req.params.id
  );

  return res.status(200).json({ service_fee });
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = updateServiceFeeSchema.parse(req.body);

  const serviceFeeModuleService: ServiceFeeModuleService = req.scope.resolve(
    SERVICE_FEE_MODULE
  );

  const service_fee = await serviceFeeModuleService.updateServiceFees({
    id: req.params.id,
    ...validatedBody,
  });

  return res.status(200).json({ service_fee });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const serviceFeeModuleService: ServiceFeeModuleService = req.scope.resolve(
    SERVICE_FEE_MODULE
  );

  await serviceFeeModuleService.deleteServiceFees(req.params.id);

  return res.status(200).json({ id: req.params.id, deleted: true });
}
