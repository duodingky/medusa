import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SERVICE_FEE_MODULE } from "../../../../modules/service-fee";
import ServiceFeeModuleService from "../../../../modules/service-fee/service";
import { ChargingLevel } from "../../../../modules/service-fee/types";
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

  let targetChargingLevel = validatedBody.charging_level;

  if (typeof targetChargingLevel === "undefined") {
    const existingServiceFee =
      await serviceFeeModuleService.retrieveServiceFee(req.params.id);
    targetChargingLevel = existingServiceFee.charging_level;
  }

  if (targetChargingLevel === ChargingLevel.GLOBAL) {
    const existingServiceFees =
      await serviceFeeModuleService.listServiceFees({});
    const hasOtherGlobalFee = existingServiceFees.some(
      (serviceFee) =>
        serviceFee.charging_level === ChargingLevel.GLOBAL &&
        serviceFee.id !== req.params.id
    );

    if (hasOtherGlobalFee) {
      return res.status(409).json({
        message: "A global service fee already exists.",
      });
    }
  }

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
