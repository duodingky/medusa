import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { VENDOR_MODULE } from "../../../../modules/vendor";
import VendorModuleService from "../../../../modules/vendor/service";
import { updateVendorSchema } from "../validation-schemas";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );

  const vendor = await vendorModuleService.retrieveVendor(req.params.id);

  return res.status(200).json({ vendor });
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = updateVendorSchema.parse(req.body);

  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );

  const vendor = await vendorModuleService.updateVendors(
    req.params.id,
    validatedBody
  );

  return res.status(200).json({ vendor });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );

  await vendorModuleService.deleteVendors(req.params.id);

  return res.status(200).json({ id: req.params.id, deleted: true });
}
