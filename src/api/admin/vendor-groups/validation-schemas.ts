import { z } from "@medusajs/framework/zod";

export const createVendorGroupSchema = z.object({
  name: z.string(),
});

export const updateVendorGroupSchema = createVendorGroupSchema.partial();

export const addVendorToGroupSchema = z.object({
  vendor_id: z.string(),
});
