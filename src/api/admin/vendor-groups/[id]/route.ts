import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { VENDOR_GROUP_MODULE } from "../../../../modules/vendor-group";
import VendorGroupModuleService from "../../../../modules/vendor-group/service";
import { updateVendorGroupSchema } from "../validation-schemas";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorGroupService: VendorGroupModuleService = req.scope.resolve(
    VENDOR_GROUP_MODULE
  );

  const vendor_group = await vendorGroupService.retrieveVendorGroup(
    req.params.id
  );

  return res.status(200).json({ vendor_group });
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = updateVendorGroupSchema.parse(req.body);

  const vendorGroupService: VendorGroupModuleService = req.scope.resolve(
    VENDOR_GROUP_MODULE
  );

  const vendor_group = await vendorGroupService.updateVendorGroups({
    id: req.params.id,
    ...validatedBody,
  });

  return res.status(200).json({ vendor_group });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const vendorGroupService: VendorGroupModuleService = req.scope.resolve(
    VENDOR_GROUP_MODULE
  );

  await vendorGroupService.deleteVendorGroups(req.params.id);

  return res.status(200).json({ id: req.params.id, deleted: true });
}
