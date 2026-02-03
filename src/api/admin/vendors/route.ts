import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { VENDOR_MODULE } from "../../../modules/vendor";
import VendorModuleService from "../../../modules/vendor/service";
import { createVendorSchema } from "./validation-schemas";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );

  const vendors = await vendorModuleService.listVendors({});

  return res.status(200).json({ vendors });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = createVendorSchema.parse(req.body);

  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );

  const vendor = await vendorModuleService.createVendors(validatedBody);

  return res.status(200).json({ vendor });
}
