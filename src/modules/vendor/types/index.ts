import { InferTypeOf } from "@medusajs/framework/types";
import { Vendor } from "../models/vendor";

export type CreateVendor = Omit<InferTypeOf<typeof Vendor>, "id">;
