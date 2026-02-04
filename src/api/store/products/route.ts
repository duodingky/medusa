import { MedusaResponse } from "@medusajs/framework/http";
import { HttpTypes } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  FeatureFlag,
  QueryContext,
  isPresent,
} from "@medusajs/framework/utils";
import indexEngineFeatureFlag from "@medusajs/medusa/feature-flags/index-engine";
import { wrapVariantsWithInventoryQuantityForSalesChannel } from "@medusajs/medusa/api/utils/middlewares/index";
import {
  RequestWithContext,
  wrapProductsWithTaxPrices,
} from "@medusajs/medusa/api/store/products/helpers";
import { applyServiceFeesToProducts } from "../../../utils/service-fee";

export const GET = async (
  req: RequestWithContext<HttpTypes.StoreProductListParams>,
  res: MedusaResponse<HttpTypes.StoreProductListResponse>
) => {
  if (FeatureFlag.isFeatureEnabled(indexEngineFeatureFlag.key)) {
    // TODO: These filters are not supported by the index engine yet
    if (
      isPresent(req.filterableFields.tags) ||
      isPresent(req.filterableFields.categories)
    ) {
      return getProducts(req, res);
    }
    return getProductsWithIndexEngine(req, res);
  }

  return getProducts(req, res);
};

const getProductsWithIndexEngine = async (
  req: RequestWithContext<HttpTypes.StoreProductListParams>,
  res: MedusaResponse<HttpTypes.StoreProductListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const context: Record<string, Record<string, unknown>> = {};
  const withInventoryQuantity = req.queryConfig.fields.some((field) =>
    field.includes("variants.inventory_quantity")
  );

  if (withInventoryQuantity) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) => !field.includes("variants.inventory_quantity")
    );
  }

  if (isPresent(req.pricingContext)) {
    context["variants"] ??= {};
    context["variants"]["calculated_price"] ??= QueryContext(
      req.pricingContext
    );
  }

  const filters = req.filterableFields;

  if (isPresent(filters.sales_channel_id)) {
    const salesChannelIds = filters.sales_channel_id;
    filters["sales_channels"] ??= {};
    filters["sales_channels"]["id"] = salesChannelIds;
    delete filters.sales_channel_id;
  }

  const { data: products = [], metadata } = await query.index(
    {
      entity: "product",
      fields: req.queryConfig.fields,
      filters,
      pagination: req.queryConfig.pagination,
      context,
    },
    {
      cache: {
        enable: true,
      },
      locale: req.locale,
    }
  );

  if (withInventoryQuantity) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(
      req,
      products.map((product) => product.variants).flat(1)
    );
  }

  await wrapProductsWithTaxPrices(req, products);
  await applyServiceFeesToProducts(req.scope, products);

  res.json({
    products,
    count: metadata.estimate_count,
    estimate_count: metadata.estimate_count,
    offset: metadata.skip,
    limit: metadata.take,
  });
};

const getProducts = async (
  req: RequestWithContext<HttpTypes.StoreProductListParams>,
  res: MedusaResponse<HttpTypes.StoreProductListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const context: Record<string, Record<string, unknown>> = {};
  const withInventoryQuantity = req.queryConfig.fields.some((field) =>
    field.includes("variants.inventory_quantity")
  );

  if (withInventoryQuantity) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) => !field.includes("variants.inventory_quantity")
    );
  }

  if (isPresent(req.pricingContext)) {
    context["variants"] ??= {};
    context["variants"]["calculated_price"] ??= QueryContext(
      req.pricingContext
    );
  }

  const { data: products = [], metadata } = await query.graph(
    {
      entity: "product",
      fields: req.queryConfig.fields,
      filters: req.filterableFields,
      pagination: req.queryConfig.pagination,
      context,
    },
    {
      cache: {
        enable: true,
      },
      locale: req.locale,
    }
  );

  if (withInventoryQuantity) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(
      req,
      products.map((product) => product.variants).flat(1)
    );
  }

  await wrapProductsWithTaxPrices(req, products);
  await applyServiceFeesToProducts(req.scope, products);

  res.json({
    products,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  });
};
