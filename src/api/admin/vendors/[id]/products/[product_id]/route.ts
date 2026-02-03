import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules, composeLinkName } from "@medusajs/framework/utils";
import { VENDOR_MODULE } from "../../../../../../modules/vendor";
import VendorModuleService from "../../../../../../modules/vendor/service";

type VendorProductLinkService = {
  list: (
    filters: Record<string, unknown>,
    config?: { take?: number }
  ) => Promise<Array<{ vendor_id?: string; product_id?: string }>>;
  dismiss: (vendorId: string, productId: string) => Promise<unknown>;
};

const getVendorProductLinkService = (req: MedusaRequest) => {
  const serviceKey = composeLinkName(
    VENDOR_MODULE,
    "vendor_id",
    Modules.PRODUCT,
    "product_id"
  );
  return req.scope.resolve(serviceKey) as VendorProductLinkService;
};

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );
  await vendorModuleService.retrieveVendor(req.params.id);

  const linkService = getVendorProductLinkService(req);
  const existing = await linkService.list(
    {
      vendor_id: req.params.id,
      product_id: req.params.product_id,
    },
    { take: 1 }
  );

  if (existing.length === 0) {
    return res.status(404).json({
      message: "Product is not linked to this vendor.",
    });
  }

  await linkService.dismiss(req.params.id, req.params.product_id);

  return res.status(200).json({
    vendor_id: req.params.id,
    product_id: req.params.product_id,
    deleted: true,
  });
}
