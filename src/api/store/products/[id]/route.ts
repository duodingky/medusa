import { MedusaResponse } from "@medusajs/framework/http";
import { HttpTypes } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
  QueryContext,
} from "@medusajs/framework/utils";
import { wrapVariantsWithInventoryQuantityForSalesChannel } from "@medusajs/medusa/api/utils/middlewares/index";
import {
  RequestWithContext,
  filterOutInternalProductCategories,
  wrapProductsWithTaxPrices,
} from "@medusajs/medusa/api/store/products/helpers";
import { applyServiceFeesToProducts } from "../../../../utils/service-fee";

export const GET = async (
  req: RequestWithContext<HttpTypes.StoreProductParams>,
  res: MedusaResponse<HttpTypes.StoreProductResponse>
) => {
  const withInventoryQuantity = req.queryConfig.fields.some((field) =>
    field.includes("variants.inventory_quantity")
  );

  if (withInventoryQuantity) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) => !field.includes("variants.inventory_quantity")
    );
  }

  const filters = {
    id: req.params.id,
    ...req.filterableFields,
  };
  const context: Record<string, Record<string, unknown>> = {};

  if (req.pricingContext) {
    context["variants"] ??= {};
    context["variants"]["calculated_price"] ??= QueryContext(
      req.pricingContext
    );
  }

  const includesCategoriesField = req.queryConfig.fields.some((field) =>
    field.startsWith("categories")
  );
  if (!req.queryConfig.fields.includes("categories.is_internal")) {
    req.queryConfig.fields.push("categories.is_internal");
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: products } = await query.graph(
    {
      entity: "product",
      filters,
      context,
      fields: req.queryConfig.fields,
    },
    {
      locale: req.locale,
    }
  );

  const product = products[0];
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id: ${req.params.id} was not found`
    );
  }

  if (withInventoryQuantity) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(
      req,
      product.variants || []
    );
  }

  if (includesCategoriesField) {
    filterOutInternalProductCategories([product]);
  }

  await wrapProductsWithTaxPrices(req, [product]);
  await applyServiceFeesToProducts(req.scope, [product]);

  res.json({ product });
};
