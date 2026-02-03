import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace";
import MarketplaceModuleService from "../../../../modules/marketplace/service";
import { updateVendorSchema } from "../validation-schemas";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceModuleService: MarketplaceModuleService = req.scope.resolve(
    MARKETPLACE_MODULE
  );

  const vendor = await marketplaceModuleService.retrieveVendor(req.params.id);

  return res.status(200).json({ vendor });
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = updateVendorSchema.parse(req.body);

  const marketplaceModuleService: MarketplaceModuleService = req.scope.resolve(
    MARKETPLACE_MODULE
  );

  const vendor = await marketplaceModuleService.updateVendors(
    req.params.id,
    validatedBody
  );

  return res.status(200).json({ vendor });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceModuleService: MarketplaceModuleService = req.scope.resolve(
    MARKETPLACE_MODULE
  );

  await marketplaceModuleService.deleteVendors(req.params.id);

  return res.status(200).json({ id: req.params.id, deleted: true });
}
