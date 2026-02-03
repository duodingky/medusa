import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MARKETPLACE_MODULE } from "../../../modules/marketplace";
import MarketplaceModuleService from "../../../modules/marketplace/service";
import { createVendorSchema } from "./validation-schemas";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceModuleService: MarketplaceModuleService = req.scope.resolve(
    MARKETPLACE_MODULE
  );

  const vendors = await marketplaceModuleService.listVendors({});

  return res.status(200).json({ vendors });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = createVendorSchema.parse(req.body);

  const marketplaceModuleService: MarketplaceModuleService = req.scope.resolve(
    MARKETPLACE_MODULE
  );

  const vendor = await marketplaceModuleService.createVendors(validatedBody);

  return res.status(200).json({ vendor });
}
