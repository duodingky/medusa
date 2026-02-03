import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { VENDOR_GROUP_MODULE } from "../../../../../../modules/vendor-group";
import VendorGroupModuleService from "../../../../../../modules/vendor-group/service";

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const vendorGroupService: VendorGroupModuleService = req.scope.resolve(
    VENDOR_GROUP_MODULE
  );

  const entries = await vendorGroupService.listVendorGroupVendors({
    vendor_group_id: req.params.id,
    vendor_id: req.params.vendor_id,
  });

  if (entries.length === 0) {
    return res.status(404).json({
      message: "Vendor is not associated with this group",
    });
  }

  await vendorGroupService.deleteVendorGroupVendors(entries[0].id);

  return res.status(200).json({
    id: req.params.vendor_id,
    vendor_group_id: req.params.id,
    deleted: true,
  });
}
