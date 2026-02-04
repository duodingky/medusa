import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SERVICE_FEE_MODULE } from "../../../../modules/service-fee";
import ServiceFeeModuleService from "../../../../modules/service-fee/service";
import { ChargingLevel, ServiceFeeStatus } from "../../../../modules/service-fee/types";
import { SERVICE_FEE_LOG_MODULE } from "../../../../modules/service-fee-log";
import ServiceFeeLogModuleService from "../../../../modules/service-fee-log/service";
import { ServiceFeeLogAction } from "../../../../modules/service-fee-log/types";
import {
  eligibilityConfigSchema,
  updateServiceFeeSchema,
} from "../validation-schemas";

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

const resolveActor = (req: MedusaRequest) => {
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
  const actor_id =
    authContext?.actor_id ??
    authContext?.user_id ??
    authContext?.auth_identity_id ??
    reqWithUser.user?.id ??
    null;
  const actor_type =
    authContext?.actor_type ?? reqWithUser.user?.actor_type ?? null;

  return { actor_id, actor_type };
};

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
  const serviceFeeLogService: ServiceFeeLogModuleService = req.scope.resolve(
    SERVICE_FEE_LOG_MODULE
  );

  const existingServiceFee = await serviceFeeModuleService.retrieveServiceFee(
    req.params.id
  );
  const targetChargingLevel =
    validatedBody.charging_level ?? existingServiceFee.charging_level;
  const shouldUpdateEligibilityConfig =
    typeof validatedBody.eligibility_config !== "undefined" ||
    (validatedBody.charging_level &&
      validatedBody.charging_level !== existingServiceFee.charging_level);

  const eligibility_config = shouldUpdateEligibilityConfig
    ? normalizeEligibilityConfig(
        targetChargingLevel,
        validatedBody.eligibility_config
      )
    : undefined;

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

  const effectiveValidFrom =
    typeof validatedBody.valid_from !== "undefined"
      ? validatedBody.valid_from
      : existingServiceFee.valid_from;
  const shouldForcePending =
    effectiveValidFrom !== null &&
    typeof effectiveValidFrom !== "undefined" &&
    effectiveValidFrom > new Date();

  const service_fee = await serviceFeeModuleService.updateServiceFees({
    id: req.params.id,
    ...validatedBody,
    ...(shouldUpdateEligibilityConfig
      ? { eligibility_config }
      : {}),
    ...(shouldForcePending ? { status: ServiceFeeStatus.PENDING } : {}),
  });

  const { actor_id, actor_type } = resolveActor(req);
  await serviceFeeLogService.createServiceFeeLogs({
    service_fee_id: service_fee.id,
    action: ServiceFeeLogAction.UPDATED,
    note: "Updated",
    actor_id,
    actor_type,
  });

  return res.status(200).json({ service_fee });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const serviceFeeModuleService: ServiceFeeModuleService = req.scope.resolve(
    SERVICE_FEE_MODULE
  );
  const serviceFeeLogService: ServiceFeeLogModuleService = req.scope.resolve(
    SERVICE_FEE_LOG_MODULE
  );

  const { actor_id, actor_type } = resolveActor(req);
  await serviceFeeModuleService.deleteServiceFees(req.params.id);
  await serviceFeeLogService.createServiceFeeLogs({
    service_fee_id: req.params.id,
    action: ServiceFeeLogAction.DELETED,
    note: "Deleted",
    actor_id,
    actor_type,
  });

  return res.status(200).json({ id: req.params.id, deleted: true });
}
