import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { VENDOR_MODULE } from "../../../../../modules/vendor";
import VendorModuleService from "../../../../../modules/vendor/service";
import { VENDOR_GROUP_MODULE } from "../../../../../modules/vendor-group";
import VendorGroupModuleService from "../../../../../modules/vendor-group/service";
import { addVendorToGroupSchema } from "../../validation-schemas";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorGroupService: VendorGroupModuleService = req.scope.resolve(
    VENDOR_GROUP_MODULE
  );
  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );

  await vendorGroupService.retrieveVendorGroup(req.params.id);

  const vendor_group_vendors = await vendorGroupService.listVendorGroupVendors({
    vendor_group_id: req.params.id,
  });

  const vendorIds = vendor_group_vendors.map((entry) => entry.vendor_id);
  const vendors =
    vendorIds.length === 0
      ? []
      : await vendorModuleService.listVendors({ id: vendorIds });

  return res.status(200).json({ vendors, vendor_group_vendors });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = addVendorToGroupSchema.parse(req.body);

  const vendorGroupService: VendorGroupModuleService = req.scope.resolve(
    VENDOR_GROUP_MODULE
  );
  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );

  await vendorGroupService.retrieveVendorGroup(req.params.id);
  await vendorModuleService.retrieveVendor(validatedBody.vendor_id);

  const existing = await vendorGroupService.listVendorGroupVendors({
    vendor_group_id: req.params.id,
    vendor_id: validatedBody.vendor_id,
  });

  const vendor_group_vendor =
    existing[0] ??
    (await vendorGroupService.createVendorGroupVendors({
      vendor_group_id: req.params.id,
      vendor_id: validatedBody.vendor_id,
    }));

  return res.status(200).json({ vendor_group_vendor });
}
