import { z } from "@medusajs/framework/zod";
import {
  ChargingLevel,
  ServiceFeeStatus,
} from "../../../modules/service-fee/types";

const optionalDate = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return value;
  },
  z.coerce.date()
);

export const createServiceFeeSchema = z.object({
  display_name: z.string(),
  fee_name: z.string(),
  charging_level: z.nativeEnum(ChargingLevel),
  rate: z.coerce.number(),
  valid_from: optionalDate.optional(),
  valid_to: optionalDate.optional(),
  status: z.nativeEnum(ServiceFeeStatus).optional(),
});

export const updateServiceFeeSchema = createServiceFeeSchema.partial();
