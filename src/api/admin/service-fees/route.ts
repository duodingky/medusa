import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SERVICE_FEE_MODULE } from "../../../modules/service-fee";
import ServiceFeeModuleService from "../../../modules/service-fee/service";
import {
  ChargingLevel,
  ServiceFeeStatus,
} from "../../../modules/service-fee/types";
import { SERVICE_FEE_LOG_MODULE } from "../../../modules/service-fee-log";
import ServiceFeeLogModuleService from "../../../modules/service-fee-log/service";
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

const buildServiceFeeLogPayload = (
  serviceFee: {
    id: string;
    display_name?: string | null;
    fee_name?: string | null;
    charging_level?: string | null;
    rate?: number | string | null;
    valid_from?: Date | string | null;
    valid_to?: Date | string | null;
    status?: string | null;
    eligibility_config?: unknown;
  },
  user: string | null
) => ({
  service_fee_id: serviceFee.id,
  user,
  display_name: serviceFee.display_name ?? null,
  fee_name: serviceFee.fee_name ?? null,
  charging_level: serviceFee.charging_level ?? null,
  rate: typeof serviceFee.rate === "undefined" ? null : serviceFee.rate,
  valid_from: serviceFee.valid_from ?? null,
  valid_to: serviceFee.valid_to ?? null,
  status: serviceFee.status ?? null,
  eligibility_config: serviceFee.eligibility_config ?? null,
  date_added: new Date(),
});

const resolveUser = (req: MedusaRequest) => {
  const authContext = req.auth_context as
    | {
        actor_id?: string;
        actor_type?: string;
        user_id?: string;
        auth_identity_id?: string;
      }
    | undefined;
  const reqWithUser = req as MedusaRequest & {
    user?: { id?: string; actor_type?: string };
  };
  const user =
    authContext?.actor_id ??
    authContext?.user_id ??
    authContext?.auth_identity_id ??
    reqWithUser.user?.id ??
    null;

  return user;
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
  const serviceFeeLogService: ServiceFeeLogModuleService = req.scope.resolve(
    SERVICE_FEE_LOG_MODULE
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

  const user = resolveUser(req);
  await serviceFeeLogService.createServiceFeeLogs(
    buildServiceFeeLogPayload(service_fee, user)
  );

  return res.status(200).json({ service_fee });
}
