import { z } from "@medusajs/framework/zod";

export const createVendorSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const updateVendorSchema = createVendorSchema.partial();
