/**
 * SERVICE FEE MODULE - INTEGRATION GUIDE
 * 
 * Complete integration instructions for adapting the Service Fee Module
 * to your existing Medusa Store API routes.
 */

// ============================================================================
// PREREQUISITE: Module Registration
// ============================================================================

// The module is already registered in medusa-config.ts:
// 
// modules: [
//   { resolve: "./modules/service-fee" },
//   // ... other modules
// ]
//
// If not present, add it to ensure the module loads on server startup.

// ============================================================================
// METHOD 1: Apply to Store Products List Endpoint
// ============================================================================

// File Path: src/api/store/products/route.ts
//
// This is the primary endpoint for fetching multiple products.
// We'll wrap it to apply service fees to all returned variants.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import ServiceFeeTransformer from "../../../modules/service-fee/service-fee-transformer";
import { HttpTypes } from "@medusajs/types";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // 1. Get the product service from the container
    const productService = req.scope.resolve("product");
    const pricingService = req.scope.resolve("pricing");

    // 2. Extract query parameters
    const { limit = 50, offset = 0, ...filters } = req.query;

    // 3. Retrieve products with variants
    const [products, count] = await productService.list(
      filters,
      {
        relations: ["variants", "variants.prices"],
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }
    );

    // 4. Transform each product to calculate prices with variants
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        // Ensure variants have calculated_amount
        const enrichedVariants = await Promise.all(
          (product.variants || []).map(async (variant) => {
            const pricing = await pricingService.calculateVariantPricing({
              variantId: variant.id,
              regionId: req.scope.resolve("region_id"),
            });

            return {
              ...variant,
              calculated_amount: pricing.calculated_amount || 0,
            };
          })
        );

        return {
          ...product,
          variants: enrichedVariants,
        };
      })
    );

    // 5. Apply service fee transformation
    const transformedProducts = ServiceFeeTransformer.transformProducts(enrichedProducts);

    // 6. Return the response with transformed products
    return res.json({
      products: transformedProducts,
      count,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ============================================================================
// METHOD 2: Apply to Single Product Detail Endpoint
// ============================================================================

// File Path: src/api/store/products/[id]/route.ts
//
// This endpoint retrieves a single product with all its variants and details.

export const GET_SINGLE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params;
    const productService = req.scope.resolve("product");
    const pricingService = req.scope.resolve("pricing");

    // 1. Retrieve the product
    const product = await productService.retrieve(id, {
      relations: ["variants", "variants.prices", "variants.options"],
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Enrich variants with pricing information
    const enrichedVariants = await Promise.all(
      (product.variants || []).map(async (variant) => {
        const pricing = await pricingService.calculateVariantPricing({
          variantId: variant.id,
          regionId: req.scope.resolve("region_id"),
        });

        return {
          ...variant,
          calculated_amount: pricing.calculated_amount || 0,
        };
      })
    );

    // 3. Create enriched product
    const enrichedProduct = {
      ...product,
      variants: enrichedVariants,
    };

    // 4. Transform with service fees
    const transformedProduct = ServiceFeeTransformer.transformProduct(enrichedProduct);

    // 5. Return response
    return res.json({
      product: transformedProduct,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Failed to fetch product" });
  }
};

// ============================================================================
// METHOD 3: Apply to Category Products Endpoint
// ============================================================================

// File Path: src/api/store/categories/[id]/products/route.ts
//
// Endpoint that returns all products in a specific category.

export const GET_CATEGORY_PRODUCTS = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id: categoryId } = req.params;
    const productService = req.scope.resolve("product");

    // Fetch products in category
    const [products] = await productService.list(
      { category_id: categoryId },
      { relations: ["variants"] }
    );

    // Transform with service fees
    const transformedProducts = ServiceFeeTransformer.transformProducts(products);

    return res.json({
      products: transformedProducts,
    });
  } catch (error) {
    console.error("Error fetching category products:", error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ============================================================================
// METHOD 4: Apply to Search/Filter Endpoint
// ============================================================================

// File Path: src/api/store/products/search/route.ts
//
// Endpoint for searching and filtering products.

export const GET_SEARCH = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { q, limit = 10, offset = 0 } = req.query;
    const productService = req.scope.resolve("product");

    // Search products
    const [products, count] = await productService.list(
      {
        title: { $ilike: `%${q}%` },
      },
      {
        relations: ["variants"],
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }
    );

    // Transform with service fees
    const transformedProducts = ServiceFeeTransformer.transformProducts(products);

    return res.json({
      products: transformedProducts,
      count,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return res.status(500).json({ message: "Search failed" });
  }
};

// ============================================================================
// METHOD 5: Use Service Directly in Business Logic
// ============================================================================

// File: src/services/product-price-service.ts
//
// Create a dedicated service for getting product prices with service fees.

import { SERVICE_FEE_MODULE } from "@/modules/service-fee";
import type { MedusaRequest } from "@medusajs/framework/http";

export class ProductPriceService {
  constructor(protected req: MedusaRequest) {}

  /**
   * Get product with calculated prices including service fees
   */
  async getProductWithPricing(productId: string) {
    const productService = this.req.scope.resolve("product");
    const pricingService = this.req.scope.resolve("pricing");
    const serviceFeeService = this.req.scope.resolve(SERVICE_FEE_MODULE);

    const product = await productService.retrieve(productId, {
      relations: ["variants"],
    });

    // Calculate pricing for variants
    const variants = await Promise.all(
      product.variants.map(async (v) => {
        const pricing = await pricingService.calculateVariantPricing({
          variantId: v.id,
        });
        return { ...v, calculated_amount: pricing.calculated_amount };
      })
    );

    // Apply service fees
    const enriched = { ...product, variants };
    return serviceFeeService.transformProduct(enriched);
  }

  /**
   * Get multiple products with pricing and service fees
   */
  async getProductsWithPricing(filters: any) {
    const productService = this.req.scope.resolve("product");
    const serviceFeeService = this.req.scope.resolve(SERVICE_FEE_MODULE);

    const [products] = await productService.list(filters);

    return serviceFeeService.transformProducts(products);
  }

  /**
   * Calculate cart total with service fees
   */
  calculateCartTotal(
    cartItems: Array<{
      variant_id: string;
      quantity: number;
      calculated_amount: number;
    }>
  ) {
    let subtotal = 0;
    let totalFees = 0;

    cartItems.forEach((item) => {
      subtotal += item.calculated_amount * item.quantity;

      // Calculate service fee per variant
      const variant = { calculated_amount: item.calculated_amount };
      const serviceFeeService = this.req.scope.resolve(SERVICE_FEE_MODULE);
      const fee = serviceFeeService.transformVariant(variant).service_fee;

      totalFees += (fee * item.quantity);
    });

    return {
      subtotal,
      service_fees: totalFees,
      total: subtotal + totalFees,
    };
  }
}

// Usage in route:
// const priceService = new ProductPriceService(req);
// const product = await priceService.getProductWithPricing("prod_123");

// ============================================================================
// METHOD 6: Conditional Service Fee Application
// ============================================================================

// Apply service fees only to specific products or variants.

import { SERVICE_FEE_MODULE } from "@/modules/service-fee";

function shouldApplyServiceFee(product: any): boolean {
  // Example: Apply service fee only to products with specific tags
  return product.tags?.includes("delivery") === true;
}

function shouldApplyToVariant(variant: any): boolean {
  // Example: Apply only to variants above certain price
  return (variant.calculated_amount || 0) > 5000; // $50+
}

function applyConditionalServiceFee(product: any, serviceFeeService: any) {
  if (!shouldApplyServiceFee(product)) {
    return product; // Skip transformation
  }

  // Transform but only update variants that qualify
  const transformedProduct = { ...product };
  transformedProduct.variants = product.variants.map((variant: any) => {
    if (!shouldApplyToVariant(variant)) {
      return variant; // Skip this variant
    }
    return serviceFeeService.transformVariant(variant);
  });

  return transformedProduct;
}

// ============================================================================
// METHOD 7: Apply Service Fee Based on Region/Locale
// ============================================================================

// File: src/modules/service-fee/regional-fee-strategy.ts

interface RegionalFeeConfig {
  region_id: string;
  fee_percentage: number;
  min_amount?: number;
  max_amount?: number;
}

const REGIONAL_FEES: RegionalFeeConfig[] = [
  { region_id: "reg_us", fee_percentage: 10 },
  { region_id: "reg_eu", fee_percentage: 15 },
  { region_id: "reg_asia", fee_percentage: 8 },
];

export function computeRegionalServiceFee(
  variant: any,
  regionId: string
): number {
  const config = REGIONAL_FEES.find((c) => c.region_id === regionId);
  if (!config) {
    return 0;
  }

  const baseAmount = variant.calculated_amount || 0;

  // Check if amount is within range (if specified)
  if (config.min_amount && baseAmount < config.min_amount) {
    return 0;
  }
  if (config.max_amount && baseAmount > config.max_amount) {
    return 0;
  }

  return Math.round(baseAmount * (config.fee_percentage / 100));
}

// Usage:
// const fee = computeRegionalServiceFee(variant, "reg_us");

// ============================================================================
// METHOD 8: Dynamic Fee Percentage Based on User/Settings
// ============================================================================

export async function getServiceFeePercentage(req: MedusaRequest): Promise<number> {
  const settingsService = req.scope.resolve("settings");

  try {
    const serviceFeeSettings = await settingsService.retrieve("service_fee_config");
    return serviceFeeSettings?.percentage || 10; // Default to 10%
  } catch {
    return 10; // Fallback to default
  }
}

// In your route:
// const feePercentage = await getServiceFeePercentage(req);
// Then use in custom fee calculation

// ============================================================================
// METHOD 9: Exclude Certain Products from Service Fee
// ============================================================================

const EXEMPT_PRODUCT_IDS = [
  "prod_gift_card", // Gift cards
  "prod_membership", // Memberships
];

const EXEMPT_CATEGORIES = [
  "cat_digital", // Digital products
  "cat_services", // Services
];

function isExemptFromServiceFee(product: any): boolean {
  if (EXEMPT_PRODUCT_IDS.includes(product.id)) {
    return true;
  }

  if (
    product.categories?.some((cat: any) =>
      EXEMPT_CATEGORIES.includes(cat.id)
    )
  ) {
    return true;
  }

  return false;
}

// Usage in transformer:
// if (isExemptFromServiceFee(product)) return product;
// else return ServiceFeeTransformer.transformProduct(product);

// ============================================================================
// METHOD 10: Log Service Fee Calculations (for debugging/analytics)
// ============================================================================

export interface ServiceFeeLog {
  variant_id: string;
  product_id: string;
  original_amount: number;
  service_fee: number;
  final_amount: number;
  timestamp: Date;
}

class ServiceFeeLogger {
  private logs: ServiceFeeLog[] = [];

  recordFee(fee: ServiceFeeLog) {
    this.logs.push({
      ...fee,
      timestamp: new Date(),
    });
  }

  getLogs(): ServiceFeeLog[] {
    return this.logs;
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Usage:
// const logger = new ServiceFeeLogger();
// logger.recordFee({
//   variant_id: "var_123",
//   product_id: "prod_123",
//   original_amount: 1000,
//   service_fee: 100,
//   final_amount: 1100,
// });

// ============================================================================
// TESTING THE INTEGRATION
// ============================================================================

// Test commands to verify integration:

// 1. Test products list endpoint:
// curl http://localhost:9000/store/products

// Expected response structure should include service_fee in variants

// 2. Test single product:
// curl http://localhost:9000/store/products/{product_id}

// 3. Check the calculated_amount is increased by service_fee amount

// Sample test response:
// {
//   "product": {
//     "id": "prod_123",
//     "variants": [
//       {
//         "id": "var_001",
//         "calculated_amount": 1100,  // Original 1000 + fee 100
//         "service_fee": 100,
//         "total_with_service_fee": 1100
//       }
//     ]
//   }
// }

// ============================================================================
// TROUBLESHOOTING INTEGRATION ISSUES
// ============================================================================

// Issue: Service fees not showing in API responses
// Solution:
// 1. Verify module is registered in medusa-config.ts
// 2. Check that transformer is being called in routes
// 3. Ensure variants have calculated_amount field

// Issue: Module not found / import errors
// Solution:
// 1. Check file paths are correct relative to your project
// 2. Run: npm run build or yarn build
// 3. Restart the Medusa server: npm run dev

// Issue: Incorrect fee amounts
// Solution:
// 1. Check the fee percentage in compute-service-fee.ts
// 2. Verify calculated_amount is in cents (not dollars)
// 3. Check for any custom fee logic overriding defaults

// Issue: Performance degradation after adding service fees
// Solution:
// 1. The transformation is lightweight and shouldn't impact performance
// 2. If issues persist, consider caching strategy
// 3. Profile your API responses to identify bottlenecks
