import {
  ContainerRegistrationKeys,
  Modules,
  composeLinkName,
} from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";
import { SERVICE_FEE_MODULE } from "../modules/service-fee";
import ServiceFeeModuleService from "../modules/service-fee/service";
import {
  ChargingLevel,
  ServiceFeeStatus,
  type ItemEligibilityConfig,
  type ServiceFee,
  type ShopEligibilityConfig,
} from "../modules/service-fee/types";
import { VENDOR_GROUP_MODULE } from "../modules/vendor-group";
import VendorGroupModuleService from "../modules/vendor-group/service";
import { VENDOR_MODULE } from "../modules/vendor";

type ProductSnapshot = {
  id: string;
  categories?: Array<{ id: string } | null> | null;
  collection_id?: string | null;
  collection?: { id?: string | null } | null;
};

type ProductVariantSnapshot = {
  calculated_price?: {
    calculated_amount?: number | null;
    final_price?: number | null;
  } | null;
};

type ProductSnapshotWithVariants = ProductSnapshot & {
  variants?: ProductVariantSnapshot[] | null;
};

type CartLineItemSnapshot = {
  product_id?: string | null;
  product?: ProductSnapshot | null;
  unit_price?: number | null;
  quantity?: number | null;
  final_price?: number | null;
  subtotal?: number | null;
  total?: number | null;
  original_total?: number | null;
  original_subtotal?: number | null;
  original_item_total?: number | null;
  original_item_subtotal?: number | null;
};

type CartSnapshot = {
  items?: CartLineItemSnapshot[] | null;
  subtotal?: number | null;
  total?: number | null;
  item_total?: number | null;
  item_subtotal?: number | null;
  original_total?: number | null;
  original_item_total?: number | null;
  original_item_subtotal?: number | null;
};

type ServiceFeeCandidate = ServiceFee & {
  eligibility_config?: ItemEligibilityConfig | ShopEligibilityConfig | null;
};

type VendorProductLink = {
  vendor_id?: string | null;
  product_id?: string | null;
};

type VendorProductModuleLinkService = {
  list: (
    filters: Record<string, unknown>,
    config?: { take?: number }
  ) => Promise<VendorProductLink[]>;
};

type VendorProductRemoteLinkService = {
  list: (
    linkDef: Record<string, unknown> | Record<string, unknown>[],
    options?: { asLinkDefinition?: boolean }
  ) => Promise<VendorProductLink[]>;
};

type VendorProductLinkAccess =
  | { mode: "module"; service: VendorProductModuleLinkService }
  | { mode: "remote"; service: VendorProductRemoteLinkService };

type ProductEligibility = {
  productId: string;
  categoryIds: string[];
  collectionId: string | null;
  vendorId: string | null;
  vendorGroupIds: string[];
};

const getVendorProductLinkAccess = (
  scope: MedusaContainer
): VendorProductLinkAccess => {
  const serviceKey = composeLinkName(
    VENDOR_MODULE,
    "vendor_id",
    Modules.PRODUCT,
    "product_id"
  );

  try {
    return {
      mode: "module",
      service: scope.resolve(serviceKey) as VendorProductModuleLinkService,
    };
  } catch (error) {
    return {
      mode: "remote",
      service: scope.resolve(
        ContainerRegistrationKeys.LINK
      ) as VendorProductRemoteLinkService,
    };
  }
};

const buildVendorProductLinkDefinition = (
  vendor: Record<string, unknown>,
  product: Record<string, unknown>
) => ({
  [VENDOR_MODULE]: vendor,
  [Modules.PRODUCT]: product,
});

const listVendorProductLinks = async (
  scope: MedusaContainer,
  productIds: string[]
) => {
  if (productIds.length === 0) {
    return [] as VendorProductLink[];
  }

  const linkAccess = getVendorProductLinkAccess(scope);
  const productFilter = productIds.length === 1 ? productIds[0] : productIds;

  if (linkAccess.mode === "module") {
    return linkAccess.service.list({ product_id: productFilter });
  }

  return linkAccess.service.list(
    buildVendorProductLinkDefinition(
      { vendor_id: { $ne: null } },
      { product_id: productFilter }
    )
  );
};

const toTimestamp = (value?: Date | string | null) => {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const isServiceFeeActive = (serviceFee: ServiceFeeCandidate, now: Date) => {
  if (serviceFee.status !== ServiceFeeStatus.ACTIVE) {
    return false;
  }

  const validFrom = serviceFee.valid_from
    ? new Date(serviceFee.valid_from)
    : null;
  if (validFrom && validFrom > now) {
    return false;
  }

  const validTo = serviceFee.valid_to ? new Date(serviceFee.valid_to) : null;
  if (validTo && validTo < now) {
    return false;
  }

  return true;
};

const normalizeIdList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  return [];
};

const matchesItemEligibility = (
  eligibility: ItemEligibilityConfig | null | undefined,
  categoryIds: string[],
  collectionId: string | null
) => {
  if (!eligibility || !("include" in eligibility)) {
    return false;
  }

  const includeCategories = normalizeIdList(eligibility.include?.categories);
  const includeCollections = normalizeIdList(eligibility.include?.collection);
  const excludeCategories = normalizeIdList(eligibility.exinclude?.categories);
  const excludeCollections = normalizeIdList(eligibility.exinclude?.collection);

  const hasInclude =
    includeCategories.length > 0 || includeCollections.length > 0;
  const matchesInclude =
    !hasInclude ||
    includeCategories.some((id) => categoryIds.includes(id)) ||
    (collectionId ? includeCollections.includes(collectionId) : false);

  const matchesExclude =
    excludeCategories.some((id) => categoryIds.includes(id)) ||
    (collectionId ? excludeCollections.includes(collectionId) : false);

  return matchesInclude && !matchesExclude;
};

const matchesShopEligibility = (
  eligibility: ShopEligibilityConfig | null | undefined,
  vendorId: string | null,
  vendorGroupIds: string[]
) => {
  if (!eligibility || !("vendors" in eligibility) || !vendorId) {
    return false;
  }

  if (eligibility.vendors === "all") {
    return true;
  }

  const vendorList = normalizeIdList(eligibility.vendors);
  const vendorGroups = normalizeIdList(eligibility.vendor_group);

  const matchesVendor = vendorList.includes(vendorId);
  const matchesVendorGroup = vendorGroups.some((groupId) =>
    vendorGroupIds.includes(groupId)
  );

  return matchesVendor || matchesVendorGroup;
};

const pickBestFee = (fees: ServiceFeeCandidate[]) => {
  if (fees.length === 0) {
    return null;
  }

  return [...fees].sort((a, b) => {
    const aStamp = Math.max(
      toTimestamp(a.valid_from),
      toTimestamp(a.date_created)
    );
    const bStamp = Math.max(
      toTimestamp(b.valid_from),
      toTimestamp(b.date_created)
    );

    if (aStamp !== bStamp) {
      return bStamp - aStamp;
    }

    const aRate = Number(a.rate ?? 0);
    const bRate = Number(b.rate ?? 0);
    return bRate - aRate;
  })[0];
};

const resolveServiceFee = (
  eligibility: ProductEligibility,
  itemFees: ServiceFeeCandidate[],
  shopFees: ServiceFeeCandidate[],
  globalFees: ServiceFeeCandidate[]
) => {
  const matchedItemFee = pickBestFee(
    itemFees.filter((fee) =>
      matchesItemEligibility(
        fee.eligibility_config as ItemEligibilityConfig | null | undefined,
        eligibility.categoryIds,
        eligibility.collectionId
      )
    )
  );

  if (matchedItemFee) {
    return matchedItemFee;
  }

  const matchedShopFee = pickBestFee(
    shopFees.filter((fee) =>
      matchesShopEligibility(
        fee.eligibility_config as ShopEligibilityConfig | null | undefined,
        eligibility.vendorId,
        eligibility.vendorGroupIds
      )
    )
  );

  if (matchedShopFee) {
    return matchedShopFee;
  }

  return pickBestFee(globalFees);
};

const calculateFeeAmount = (base: number, rate: number) => {
  if (!Number.isFinite(rate) || rate <= 0) {
    return 0;
  }

  return (base * rate) / 100;
};

const addNumericDelta = (
  target: Record<string, unknown>,
  field: string,
  delta: number
) => {
  const current = target[field];
  if (typeof current === "number") {
    target[field] = current + delta;
  }
};

const fetchProductAttributes = async (
  scope: MedusaContainer,
  productIds: string[]
) => {
  if (productIds.length === 0) {
    return new Map<string, { categoryIds: string[]; collectionId: string | null }>();
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "collection_id", "categories.id"],
    filters: { id: productIds },
  });

  return new Map(
    (data ?? []).map((product: ProductSnapshot) => [
      product.id,
      {
        categoryIds:
          product.categories?.flatMap((category) =>
            category?.id ? [category.id] : []
          ) ?? [],
        collectionId: product.collection_id ?? null,
      },
    ])
  );
};

const fetchVendorGroupMap = async (
  scope: MedusaContainer,
  vendorIds: string[]
) => {
  if (vendorIds.length === 0) {
    return new Map<string, string[]>();
  }

  const vendorGroupService: VendorGroupModuleService = scope.resolve(
    VENDOR_GROUP_MODULE
  );
  const vendorGroupLinks = await vendorGroupService.listVendorGroupVendors({
    vendor_id: vendorIds.length === 1 ? vendorIds[0] : vendorIds,
  });

  const map = new Map<string, string[]>();
  vendorGroupLinks.forEach((link) => {
    if (!link.vendor_id || !link.vendor_group_id) {
      return;
    }

    const existing = map.get(link.vendor_id) ?? [];
    map.set(link.vendor_id, [...existing, link.vendor_group_id]);
  });

  return map;
};

const resolveServiceFees = async (scope: MedusaContainer) => {
  const serviceFeeModuleService: ServiceFeeModuleService = scope.resolve(
    SERVICE_FEE_MODULE
  );
  const now = new Date();
  const serviceFees = await serviceFeeModuleService.listServiceFees({});
  const activeFees = serviceFees.filter((fee) =>
    isServiceFeeActive(fee, now)
  );

  return {
    itemFees: activeFees.filter(
      (fee) => fee.charging_level === ChargingLevel.ITEM_LEVEL
    ),
    shopFees: activeFees.filter(
      (fee) => fee.charging_level === ChargingLevel.SHOP_LEVEL
    ),
    globalFees: activeFees.filter(
      (fee) => fee.charging_level === ChargingLevel.GLOBAL
    ),
  };
};

const buildProductEligibilityMap = async (
  scope: MedusaContainer,
  products: ProductSnapshot[],
  needsItemLevel: boolean,
  needsShopLevel: boolean
) => {
  const productIds = Array.from(
    new Set(products.map((product) => product.id).filter(Boolean))
  );

  const [attributesMap, vendorLinks] = await Promise.all([
    needsItemLevel ? fetchProductAttributes(scope, productIds) : new Map(),
    needsShopLevel ? listVendorProductLinks(scope, productIds) : [],
  ]);

  const vendorByProduct = new Map<string, string | null>();
  if (needsShopLevel) {
    vendorLinks.forEach((link) => {
      if (link.product_id && link.vendor_id) {
        vendorByProduct.set(link.product_id, link.vendor_id);
      }
    });
  }

  const vendorIds = Array.from(new Set(vendorByProduct.values())).filter(
    (value): value is string => !!value
  );
  const vendorGroupMap = needsShopLevel
    ? await fetchVendorGroupMap(scope, vendorIds)
    : new Map<string, string[]>();

  const eligibilityMap = new Map<string, ProductEligibility>();

  products.forEach((product) => {
    const attributes = attributesMap.get(product.id);
    const categoryIds =
      product.categories?.flatMap((category) =>
        category?.id ? [category.id] : []
      ) ?? attributes?.categoryIds ?? [];
    const collectionId =
      product.collection_id ??
      product.collection?.id ??
      attributes?.collectionId ??
      null;
    const vendorId = vendorByProduct.get(product.id) ?? null;
    const vendorGroupIds = vendorId
      ? vendorGroupMap.get(vendorId) ?? []
      : [];

    eligibilityMap.set(product.id, {
      productId: product.id,
      categoryIds,
      collectionId,
      vendorId,
      vendorGroupIds,
    });
  });

  return eligibilityMap;
};

export const applyServiceFeesToProducts = async (
  scope: MedusaContainer,
  products: ProductSnapshotWithVariants[]
) => {
  if (!products.length) {
    return;
  }

  const { itemFees, shopFees, globalFees } = await resolveServiceFees(scope);
  const needsItemLevel = itemFees.length > 0;
  const needsShopLevel = shopFees.length > 0;
  const eligibilityMap = await buildProductEligibilityMap(
    scope,
    products,
    needsItemLevel,
    needsShopLevel
  );

  products.forEach((product) => {
    const eligibility = eligibilityMap.get(product.id);
    const fee = eligibility
      ? resolveServiceFee(eligibility, itemFees, shopFees, globalFees)
      : pickBestFee(globalFees);
    const rate = Number(fee?.rate ?? 0);
   

    product.variants?.forEach((variant) => {
      const calculatedPrice = variant.calculated_price;
      if (!calculatedPrice || calculatedPrice.calculated_amount == null) {
        return;
      }

      const baseAmount = Number(calculatedPrice.calculated_amount);
      if (!Number.isFinite(baseAmount)) {
        return;
      }

      const feeAmount = calculateFeeAmount(baseAmount, rate);
      const adjustedAmount = baseAmount + feeAmount;
      calculatedPrice.calculated_amount = adjustedAmount;
      calculatedPrice.final_price = adjustedAmount;
    });
  });
};

export const applyServiceFeesToCart = async (
  scope: MedusaContainer,
  cart: CartSnapshot
) => {
  const items = cart.items ?? [];
  if (items.length === 0) {
    return;
  }

  const { itemFees, shopFees, globalFees } = await resolveServiceFees(scope);
  const needsItemLevel = itemFees.length > 0;
  const needsShopLevel = shopFees.length > 0;
  const fallbackFee = pickBestFee(globalFees);
  const fallbackRate = Number(fallbackFee?.rate ?? 0);
  const products = items
    .map((item) =>
      item.product
        ? item.product
        : item.product_id
          ? { id: item.product_id }
          : null
    )
    .filter((product): product is ProductSnapshot => !!product);
  const eligibilityMap = await buildProductEligibilityMap(
    scope,
    products,
    needsItemLevel,
    needsShopLevel
  );

  let feeTotal = 0;

  items.forEach((item) => {
    const productId = item.product_id ?? item.product?.id;
    if (item.unit_price == null) {
      return;
    }

    const eligibility = productId ? eligibilityMap.get(productId) : undefined;
    const fee = eligibility
      ? resolveServiceFee(eligibility, itemFees, shopFees, globalFees)
      : fallbackFee;
    const rate =
      fee && typeof fee.rate !== "undefined" ? Number(fee.rate) : fallbackRate;
    const feeAmount = calculateFeeAmount(item.unit_price, rate);
    const quantity = item.quantity ?? 1;
    const itemFeeTotal = feeAmount * quantity;

    item.final_price = item.unit_price + feeAmount;
    item.unit_price = item.final_price;
    feeTotal += itemFeeTotal;

    addNumericDelta(item, "subtotal", itemFeeTotal);
    addNumericDelta(item, "total", itemFeeTotal);
    addNumericDelta(item, "original_total", itemFeeTotal);
    addNumericDelta(item, "original_subtotal", itemFeeTotal);
    addNumericDelta(item, "original_item_total", itemFeeTotal);
    addNumericDelta(item, "original_item_subtotal", itemFeeTotal);
  });

  if (feeTotal !== 0) {
    addNumericDelta(cart, "subtotal", feeTotal);
    addNumericDelta(cart, "total", feeTotal);
    addNumericDelta(cart, "item_total", feeTotal);
    addNumericDelta(cart, "item_subtotal", feeTotal);
    addNumericDelta(cart, "original_total", feeTotal);
    addNumericDelta(cart, "original_item_total", feeTotal);
    addNumericDelta(cart, "original_item_subtotal", feeTotal);
  }
};

