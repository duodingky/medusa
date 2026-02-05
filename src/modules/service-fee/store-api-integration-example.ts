/**
 * Service Fee Module Integration Guide for Store API Routes
 * 
 * This file demonstrates how to integrate the service fee transformer
 * into your Store API product routes to automatically apply service fees
 * to product variants.
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { contentsHandler, defaultStoreProductsListFields, defaultStoreProductsFields } from "@medusajs/medusa/api/store/products";
import ServiceFeeTransformer from "../service-fee-transformer";

/**
 * Example 1: Wrap existing store product list endpoint with service fee transformer
 * 
 * Path: /store/products (GET)
 * This applies service fees to all products returned in the list
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Call the default products endpoint handler
    const response = await contentsHandler(req, res);

    // Apply the service fee transformer to the response data
    if (response && response.products && Array.isArray(response.products)) {
      response.products = ServiceFeeTransformer.transformProducts(response.products);
    }

    res.json(response);
  } catch (error) {
    throw error;
  }
}

/**
 * Example 2: Direct product retrieval with service fee transformation
 * 
 * Path: /store/products/:id (GET)
 * This applies service fee to a single product
 */
export async function getProductWithServiceFee(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { product_service } } = req.scope;
  const { id } = req.params;

  try {
    // Retrieve the product
    const product = await product_service.retrieve(id, {
      relations: ["variants"],
    });

    // Transform the product to include service fees
    const transformedProduct = ServiceFeeTransformer.transformProduct(product);

    res.json({
      product: transformedProduct,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Example 3: Using the transformer middleware directly
 * 
 * This middleware can be applied to any route that returns products
 * to automatically transform the responses
 */
export const serviceFeeMiddleware = ServiceFeeTransformer.createMiddleware();

/**
 * Example 4: Service fee calculation for specific use cases
 * 
 * You can also manually calculate and apply service fees
 * for specific business logic
 */
export async function getCartTotalWithServiceFees(
  cartItems: Array<{ variant_id: string; quantity: number; calculated_amount: number }>
) {
  let totalServiceFee = 0;

  for (const item of cartItems) {
    // This would typically fetch the full variant object
    const variantData = {
      calculated_amount: item.calculated_amount,
      quantity: item.quantity,
    };

    // Transform the variant to calculate service fee
    const transformedVariant = ServiceFeeTransformer.transformVariant(variantData);

    // Add to total
    totalServiceFee += transformedVariant.service_fee || 0;
  }

  return totalServiceFee;
}
