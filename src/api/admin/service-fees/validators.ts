import { z } from "zod"

export const CreateServiceFeeSchema = z.object({
  name: z.string().min(1),
  display_name: z.string().min(1),
  rate: z.number(), 
  // enum matches your model definition
  type: z.enum(["global", "item", "shop"]),
  status: z.enum(["active", "pending", "inactive"]).default("pending"),
  // Zod can transform strings to Date objects
  effective_date: z.preprocess((arg) => (typeof arg === "string" ? new Date(arg) : arg), z.date()),
  end_date: z.preprocess((arg) => (typeof arg === "string" ? new Date(arg) : arg), z.date()).nullable().optional(),
  // json defaults to an empty object
  eligibility_config: z.record(z.any()).default({}),
  metadata: z.record(z.unknown()).optional(),
})

export const UpdateServiceFeeSchema = CreateServiceFeeSchema.partial()