import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { VENDOR_MODULE } from "../../../../../../modules/vendor";
import VendorModuleService from "../../../../../../modules/vendor/service";

type LinkRecord = Record<string, any>;

const normalizeLinkList = (result: unknown): LinkRecord[] => {
  if (Array.isArray(result)) {
    return result as LinkRecord[];
  }

  if (result && typeof result === "object" && "data" in result) {
    const data = (result as { data?: unknown }).data;
    return Array.isArray(data) ? (data as LinkRecord[]) : [];
  }

  return [];
};

const dismissLink = async (
  linkService: any,
  input: Record<string, unknown>
) => {
  if (typeof linkService.dismiss === "function") {
    return linkService.dismiss(input);
  }

  if (typeof linkService.delete === "function") {
    return linkService.delete(input);
  }

  if (typeof linkService.remove === "function") {
    return linkService.remove(input);
  }

  throw new Error("Link service does not support deletion.");
};

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const vendorModuleService: VendorModuleService = req.scope.resolve(
    VENDOR_MODULE
  );
  await vendorModuleService.retrieveVendor(req.params.id);

  const linkService = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const existing = await linkService.list({
    [VENDOR_MODULE]: { vendor_id: req.params.id },
    [Modules.PRODUCT]: { product_id: req.params.product_id },
  });

  const links = normalizeLinkList(existing);
  if (links.length === 0) {
    return res.status(404).json({
      message: "Product is not linked to this vendor.",
    });
  }

  await dismissLink(linkService, {
    [VENDOR_MODULE]: { vendor_id: req.params.id },
    [Modules.PRODUCT]: { product_id: req.params.product_id },
  });

  return res.status(200).json({
    vendor_id: req.params.id,
    product_id: req.params.product_id,
    deleted: true,
  });
}
