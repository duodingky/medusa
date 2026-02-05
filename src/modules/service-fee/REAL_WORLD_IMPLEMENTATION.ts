/**
 * REAL-WORLD IMPLEMENTATION EXAMPLE
 * 
 * This file shows how to integrate the Service Fee Module into
 * your actual Medusa v2 Store API routes.
 * 
 * This is production-ready code you can copy and adapt.
 */

// ============================================================================
// EXAMPLE 1: Integrate into /store/products endpoint
// ============================================================================

// File: src/api/store/products/route.ts
// This is where all products are listed in the Store API

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import ServiceFeeTransformer from "../../../modules/service-fee/service-fee-transformer";
import { HttpTypes } from "@medusajs/types";

/**
 * GET /store/products
 * 
 * Lists all products with service fees applied to variants.
 * Frontend receives adjusted calculated_amount values automatically.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<any> {
  try {
    // 1️⃣ Get services from DI container
    const remoteQueryFunction = req.scope.resolve("remoteQuery");
    const remoteLink = req.scope.resolve("remoteLink");

    // 2️⃣ Build the query with standard fields
    const query = {
      products: {
        fields: [
          "id",
          "title",
          "description",
          "thumbnail",
          "handle",
          "variants",
          "variants.id",
          "variants.title",
          "variants.sku",
          "variants.calculated_amount",
          "variants.inventory_quantity",
        ],
        filters: req.query.filters || {},
        pagination: {
          take: parseInt(req.query.limit as string) || 20,
          skip: parseInt(req.query.offset as string) || 0,
        },
      },
    };

    // 3️⃣ Execute the remote query to fetch products
    const { products, count } = await remoteQueryFunction(query);

    // 4️⃣ ✨ APPLY SERVICE FEE TRANSFORMATION
    // This is the key step - transform products to include service fees
    const transformedProducts = ServiceFeeTransformer.transformProducts(products);

    // 5️⃣ Return response with transformed products
    return res.json({
      products: transformedProducts,
      count,
      offset: parseInt(req.query.offset as string) || 0,
      limit: parseInt(req.query.limit as string) || 20,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ 
      message: "Failed to fetch products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// ============================================================================
// EXAMPLE 2: Integrate into /store/products/[id] endpoint
// ============================================================================

// File: src/api/store/products/[id]/route.ts
// This is for fetching a single product detail

export async function GET_DETAIL(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<any> {
  const { id } = req.params;

  try {
    const remoteQueryFunction = req.scope.resolve("remoteQuery");

    // Fetch single product with all details
    const query = {
      products: {
        fields: [
          "id",
          "title",
          "description",
          "thumbnail",
          "collection",
          "tags",
          "variants",
          "variants.id",
          "variants.title",
          "variants.sku",
          "variants.calculated_amount",
          "variants.inventory_quantity",
          "variants.options",
        ],
        filters: { id },
      },
    };

    const { products } = await remoteQueryFunction(query);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = products[0];

    // ✨ Apply service fee transformation
    const transformedProduct = ServiceFeeTransformer.transformProduct(product);

    return res.json({
      product: transformedProduct,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Failed to fetch product" });
  }
}

// ============================================================================
// EXAMPLE 3: Service Fee in /store/carts/[id] endpoint
// ============================================================================

// File: src/api/store/carts/[id]/route.ts
// Show cart with increased amounts for service fees

import { SERVICE_FEE_MODULE } from "../../../modules/service-fee";

export async function GET_CART(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<any> {
  const { id: cartId } = req.params;

  try {
    const remoteQuery = req.scope.resolve("remoteQuery");
    const serviceFeeService = req.scope.resolve(SERVICE_FEE_MODULE);

    // Fetch cart with items and variants
    const query = {
      carts: {
        fields: [
          "id",
          "items",
          "items.id",
          "items.quantity",
          "items.variant_id",
          "items.variant",
          "items.variant.calculated_amount",
          "items.subtotal",
          "items.total",
          "subtotal",
          "total",
        ],
        filters: { id: cartId },
      },
    };

    const { carts } = await remoteQuery(query);

    if (!carts || carts.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cart = carts[0];

    // ✨ Transform each cart item variant with service fees
    const cartWithFees = {
      ...cart,
      items: cart.items.map((item: any) => {
        const variant = item.variant;

        if (variant) {
          // Transform variant to include service fee
          const transformedVariant = serviceFeeService.transformVariant(variant);

          // Update item with new total including service fee
          const newTotal = transformedVariant.calculated_amount * item.quantity;

          return {
            ...item,
            variant: transformedVariant,
            total: newTotal, // Updated total with service fees
          };
        }

        return item;
      }),
      // Recalculate cart totals with service fees
      subtotal: cart.subtotal, // Keep original subtotal
      service_fees_total: cart.items.reduce((total: number, item: any) => {
        const variant = item.variant;
        if (variant) {
          const transformed = serviceFeeService.transformVariant(variant);
          return total + ((transformed.service_fee || 0) * item.quantity);
        }
        return total;
      }, 0),
      total: cart.total + (
        // Add total service fees to cart total
        cart.items.reduce((fee: number, item: any) => {
          const variant = item.variant;
          if (variant) {
            const transformed = serviceFeeService.transformVariant(variant);
            return fee + ((transformed.service_fee || 0) * item.quantity);
          }
          return fee;
        }, 0)
      ),
    };

    return res.json({
      cart: cartWithFees,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({ message: "Failed to fetch cart" });
  }
}

// ============================================================================
// EXAMPLE 4: Always-On Middleware Approach
// ============================================================================

// File: src/api/middlewares.ts
// This applies service fees to ALL product responses automatically

import ServiceFeeTransformer from "../modules/service-fee/service-fee-transformer";

/**
 * Middleware to automatically apply service fees to all product responses
 * This ensures every product endpoint returns adjusted amounts
 */
export function serviceFeesMiddleware() {
  return (req: any, res: any, next: any) => {
    // Only apply to product-related endpoints
    if (!req.path.includes("/store/products")) {
      return next();
    }

    // Store original json response method
    const originalJson = res.json.bind(res);

    // Override json method to transform response
    res.json = function (body: any) {
      try {
        // Transform response body
        if (body) {
          if (body.product) {
            // Single product response
            body.product = ServiceFeeTransformer.transformProduct(body.product);
          } else if (body.products && Array.isArray(body.products)) {
            // Multiple products response
            body.products = ServiceFeeTransformer.transformProducts(body.products);
          }
        }
      } catch (error) {
        console.error("Error applying service fees:", error);
        // Continue without transformation if error
      }

      // Call original json method with transformed body
      return originalJson(body);
    };

    next();
  };
}

// Register in main API setup (if using Express directly):
// app.use("/store/products", serviceFeesMiddleware());

// ============================================================================
// EXAMPLE 5: Custom Business Logic Integration
// ============================================================================

// File: src/services/product-with-fees-service.ts
// Create a dedicated service for product operations with fees

import type { MedusaRequest } from "@medusajs/framework/http";
import { SERVICE_FEE_MODULE } from "../modules/service-fee";

export class ProductWithFeesService {
  constructor(private req: MedusaRequest) {}

  /**
   * Get products by category with service fees applied
   */
  async getProductsByCategory(categoryId: string, limit: number = 20, offset: number = 0) {
    const remoteQuery = this.req.scope.resolve("remoteQuery");
    const serviceFeeService = this.req.scope.resolve(SERVICE_FEE_MODULE);

    const query = {
      products: {
        fields: [
          "id", "title", "thumbnail",
          "variants", "variants.id", "variants.title", 
          "variants.calculated_amount"
        ],
        filters: { category_id: categoryId },
        pagination: { take: limit, skip: offset },
      },
    };

    const { products, count } = await remoteQuery(query);

    // Transform products with service fees
    const transformedProducts = serviceFeeService.transformProducts(products);

    return { products: transformedProducts, count };
  }

  /**
   * Get featured products with service fees
   */
  async getFeaturedProducts(limit: number = 10) {
    const remoteQuery = this.req.scope.resolve("remoteQuery");
    const serviceFeeService = this.req.scope.resolve(SERVICE_FEE_MODULE);

    const query = {
      products: {
        fields: [
          "id", "title", "thumbnail", "collection",
          "variants", "variants.id", "variants.calculated_amount"
        ],
        filters: { collection_id: "featured" },
        pagination: { take: limit },
      },
    };

    const { products } = await remoteQuery(query);
    const transformed = serviceFeeService.transformProducts(products);

    return transformed;
  }

  /**
   * Get product with all details and service fees
   */
  async getProductDetail(productId: string) {
    const remoteQuery = this.req.scope.resolve("remoteQuery");
    const serviceFeeService = this.req.scope.resolve(SERVICE_FEE_MODULE);

    const query = {
      products: {
        fields: [
          "*",
          "variants.*",
          "variants.prices",
          "variants.options",
        ],
        filters: { id: productId },
      },
    };

    const { products } = await remoteQuery(query);

    if (!products || products.length === 0) {
      throw new Error("Product not found");
    }

    const product = products[0];
    return serviceFeeService.transformProduct(product);
  }

  /**
   * Calculate total cart value with service fees
   */
  calculateCartTotalWithFees(cartItems: Array<{
    variant_id: string;
    quantity: number;
    calculated_amount: number;
  }>): {
    subtotal: number;
    service_fees: number;
    total: number;
  } {
    const serviceFeeService = this.req.scope.resolve(SERVICE_FEE_MODULE);

    let subtotal = 0;
    let totalServiceFees = 0;

    cartItems.forEach((item) => {
      const itemSubtotal = item.calculated_amount * item.quantity;
      subtotal += itemSubtotal;

      // Calculate service fee per variant
      const variant = { calculated_amount: item.calculated_amount };
      const transformed = serviceFeeService.transformVariant(variant);
      const itemServiceFee = (transformed.service_fee || 0) * item.quantity;

      totalServiceFees += itemServiceFee;
    });

    return {
      subtotal,
      service_fees: totalServiceFees,
      total: subtotal + totalServiceFees,
    };
  }
}

// Usage in a route:
// const productService = new ProductWithFeesService(req);
// const products = await productService.getProductsByCategory("cat_123");

// ============================================================================
// EXAMPLE 6: Conditional Application
// ============================================================================

// Only apply service fees to delivery-related products

import ServiceFeeTransformer from "../modules/service-fee/service-fee-transformer";

const APPLY_SERVICE_FEE_TAGS = ["delivery", "food", "groceries"];

function shouldApplyServiceFee(product: any): boolean {
  return product.tags?.some((tag: any) => 
    APPLY_SERVICE_FEE_TAGS.includes(tag.value || tag)
  ) || false;
}

export async function GET_WITH_CONDITIONAL_FEES(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<any> {
  const remoteQuery = req.scope.resolve("remoteQuery");

  const query = {
    products: {
      fields: ["id", "title", "tags", "variants", "variants.calculated_amount"],
    },
  };

  const { products } = await remoteQuery(query);

  // Only transform products that should have service fees
  const transformedProducts = products.map((product: any) => {
    if (shouldApplyServiceFee(product)) {
      return ServiceFeeTransformer.transformProduct(product);
    }
    return product; // Skip transformation for other products
  });

  return res.json({ products: transformedProducts });
}

// ============================================================================
// EXAMPLE 7: Testing the Integration
// ============================================================================

// File: src/__tests__/store-products-with-fees.test.ts

import { test } from "@jest/globals";
import ServiceFeeTransformer from "../modules/service-fee/service-fee-transformer";
import { computeServiceFee, computeTieredServiceFee } from "../modules/service-fee/utils/compute-service-fee";

describe("Store Products with Service Fees", () => {
  test("should add 10% service fee to product variants", () => {
    const product = {
      id: "prod_1",
      variants: [
        { id: "var_1", calculated_amount: 1000 },
      ],
    };

    const transformed = ServiceFeeTransformer.transformProduct(product);

    expect(transformed.variants[0].calculated_amount).toBe(1100);
    expect(transformed.variants[0].service_fee).toBe(100);
  });

  test("should handle multiple variants", () => {
    const product = {
      id: "prod_2",
      variants: [
        { id: "var_1", calculated_amount: 2000 },
        { id: "var_2", calculated_amount: 3000 },
        { id: "var_3", calculated_amount: 1500 },
      ],
    };

    const transformed = ServiceFeeTransformer.transformProduct(product);

    expect(transformed.variants[0].calculated_amount).toBe(2200);
    expect(transformed.variants[1].calculated_amount).toBe(3300);
    expect(transformed.variants[2].calculated_amount).toBe(1650);
  });

  test("should calculate correct tiered fees", () => {
    const lowAmountFee = computeTieredServiceFee({ calculated_amount: 500 }); // 5%
    const midAmountFee = computeTieredServiceFee({ calculated_amount: 2500 }); // 8%
    const highAmountFee = computeTieredServiceFee({ calculated_amount: 10000 }); // 10%

    expect(lowAmountFee).toBe(25);
    expect(midAmountFee).toBe(200);
    expect(highAmountFee).toBe(1000);
  });
});

// ============================================================================
// HOW TO USE THIS EXAMPLE IN YOUR PROJECT
// ============================================================================

/*
1. Copy the code from the example that matches your use case:
   - Example 1: Basic products listing
   - Example 2: Single product detail
   - Example 3: Shopping cart
   - Example 4: Global middleware
   - Example 5: Business logic service
   - Example 6: Conditional application
   - Example 7: Testing

2. Place the code in your corresponding route file:
   - src/api/store/products/route.ts
   - src/api/store/products/[id]/route.ts
   - src/api/store/carts/[id]/route.ts
   - etc.

3. Adjust the field names and query structure to match your:
   - Remote query structure
   - Database field names
   - API response format

4. Test by:
   - Starting your Medusa server: npm run dev
   - Calling an API endpoint: GET http://localhost:9000/store/products
   - Verifying calculated_amount includes service fee
   - Checking service_fee field is present

5. Deploy when satisfied!

All transformations happen backend-side, so no frontend changes needed.
The Medusa SDK frontend will automatically receive the adjusted amounts.
*/
