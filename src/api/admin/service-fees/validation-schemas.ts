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

const itemSelectionSchema = z
  .object({
    categories: z.array(z.string()).optional(),
    collection: z.array(z.string()).optional(),
  })
  .strict()
  .transform((value) => ({
    categories: value.categories ?? [],
    collection: value.collection ?? [],
  }));

const rawItemEligibilityConfigSchema = z
  .object({
    include: itemSelectionSchema.optional(),
    exinclude: itemSelectionSchema.optional(),
  })
  .strict()
  .transform((value) => ({
    include:
      value.include ?? ({
        categories: [],
        collection: [],
      } as const),
    exinclude:
      value.exinclude ?? ({
        categories: [],
        collection: [],
      } as const),
  }));

const itemEligibilityConfigSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  if ("exclude" in record && !("exinclude" in record)) {
    const { exclude, ...rest } = record;
    return {
      ...rest,
      exinclude: exclude,
    };
  }

  return value;
}, rawItemEligibilityConfigSchema);

const shopEligibilityConfigSchema = z
  .object({
    vendors: z.union([z.literal("all"), z.array(z.string())]).optional(),
    vendor_group: z.array(z.string()).optional(),
  })
  .strict()
  .transform((value) => {
    if (value.vendors === "all") {
      return { vendors: "all" as const };
    }

    return {
      vendors: value.vendors ?? [],
      vendor_group: value.vendor_group ?? [],
    };
  });

export const eligibilityConfigSchema = z.union([
  itemEligibilityConfigSchema,
  shopEligibilityConfigSchema,
]);

export const createServiceFeeSchema = z.object({
  display_name: z.string(),
  fee_name: z.string(),
  charging_level: z.nativeEnum(ChargingLevel),
  rate: z.coerce.number(),
  valid_from: optionalDate.optional(),
  valid_to: optionalDate.optional(),
  status: z.nativeEnum(ServiceFeeStatus).optional(),
  eligibility_config: eligibilityConfigSchema.optional().nullable(),
});

export const updateServiceFeeSchema = createServiceFeeSchema.partial();
