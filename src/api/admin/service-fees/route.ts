import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SERVICE_FEE_MODULE } from "../../../modules/service-fee";
import ServiceFeeModuleService from "../../../modules/service-fee/service";
import {
  ChargingLevel,
  ServiceFeeStatus,
} from "../../../modules/service-fee/types";
import { createServiceFeeSchema } from "./validation-schemas";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const serviceFeeModuleService: ServiceFeeModuleService = req.scope.resolve(
    SERVICE_FEE_MODULE
  );

  const service_fees = await serviceFeeModuleService.listServiceFees({});

  return res.status(200).json({ service_fees });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = createServiceFeeSchema.parse(req.body);

  const serviceFeeModuleService: ServiceFeeModuleService = req.scope.resolve(
    SERVICE_FEE_MODULE
  );

  if (validatedBody.charging_level === ChargingLevel.GLOBAL) {
    const existingServiceFees =
      await serviceFeeModuleService.listServiceFees({});
    const hasGlobalFee = existingServiceFees.some(
      (serviceFee) => serviceFee.charging_level === ChargingLevel.GLOBAL
    );

    if (hasGlobalFee) {
      return res.status(409).json({
        message: "A global service fee already exists.",
      });
    }
  }

  const service_fee = await serviceFeeModuleService.createServiceFees({
    ...validatedBody,
    status: validatedBody.status ?? ServiceFeeStatus.PENDING,
    date_created: new Date(),
  });

  return res.status(200).json({ service_fee });
}
