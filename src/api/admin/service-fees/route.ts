import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SERVICE_FEE_MODULE } from "../../../modules/service-fee";
import ServiceFeeModuleService from "../../../modules/service-fee/service";
import {
  ChargingLevel,
  ServiceFeeStatus,
} from "../../../modules/service-fee/types";
import {
  eligibilityConfigSchema,
  createServiceFeeSchema,
} from "./validation-schemas";

const defaultItemEligibilityConfig = {
  include: {
    categories: [],
    collection: [],
  },
  exinclude: {
    categories: [],
    collection: [],
  },
};

const defaultShopEligibilityConfig = {
  vendors: [],
  vendor_group: [],
};

const normalizeEligibilityConfig = (
  chargingLevel: ChargingLevel,
  eligibilityConfig: unknown
) => {
  if (chargingLevel === ChargingLevel.ITEM_LEVEL) {
    const parsed = eligibilityConfigSchema.safeParse(
      eligibilityConfig ?? defaultItemEligibilityConfig
    );
    if (parsed.success && "include" in parsed.data) {
      return parsed.data;
    }
    return defaultItemEligibilityConfig;
  }

  if (chargingLevel === ChargingLevel.SHOP_LEVEL) {
    const parsed = eligibilityConfigSchema.safeParse(
      eligibilityConfig ?? defaultShopEligibilityConfig
    );
    if (parsed.success && "vendors" in parsed.data) {
      return parsed.data;
    }
    return defaultShopEligibilityConfig;
  }

  return null;
};

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

  const now = new Date();
  const shouldForcePending =
    validatedBody.valid_from && validatedBody.valid_from > now;
  const eligibility_config = normalizeEligibilityConfig(
    validatedBody.charging_level,
    validatedBody.eligibility_config
  );

  const service_fee = await serviceFeeModuleService.createServiceFees({
    ...validatedBody,
    eligibility_config,
    status: shouldForcePending
      ? ServiceFeeStatus.PENDING
      : validatedBody.status ?? ServiceFeeStatus.PENDING,
    date_created: new Date(),
  });

  return res.status(200).json({ service_fee });
}
