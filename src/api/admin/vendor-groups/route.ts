import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { VENDOR_GROUP_MODULE } from "../../../modules/vendor-group";
import VendorGroupModuleService from "../../../modules/vendor-group/service";
import { createVendorGroupSchema } from "./validation-schemas";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorGroupService: VendorGroupModuleService = req.scope.resolve(
    VENDOR_GROUP_MODULE
  );

  const vendor_groups = await vendorGroupService.listVendorGroups({});

  return res.status(200).json({ vendor_groups });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = createVendorGroupSchema.parse(req.body);

  const vendorGroupService: VendorGroupModuleService = req.scope.resolve(
    VENDOR_GROUP_MODULE
  );

  const vendor_group = await vendorGroupService.createVendorGroups(
    validatedBody
  );

  return res.status(200).json({ vendor_group });
}
