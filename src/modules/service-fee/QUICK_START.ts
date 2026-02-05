/**
 * SERVICE FEE MODULE - QUICK START GUIDE
 * 
 * This is the essential setup guide for integrating the Service Fee Module
 * into your Medusa v2 Store API.
 */

// ============================================================================
// STEP 1: VERIFY MODULE REGISTRATION (medusa-config.ts)
// ============================================================================

// The module should already be registered in medusa-config.ts:
// modules: [
//   { resolve: "./modules/service-fee" },
//   // ... other modules
// ]

// ============================================================================
// STEP 2: APPLY TO STORE API ROUTES
// ============================================================================

// OPTION A: Apply to all product list endpoints
// File: src/api/store/products/route.ts

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import ServiceFeeTransformer from "../../../modules/service-fee/service-fee-transformer";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Your existing product retrieval logic
  const products = await req.scope
    .resolve("product")
    .list({}, { relations: ["variants"] });

  // Transform products to include service fees
  const transformedProducts = ServiceFeeTransformer.transformProducts(products);

  return res.json({
    products: transformedProducts,
    count: transformedProducts.length,
  });
}

// ============================================================================
// STEP 3: APPLY TO SINGLE PRODUCT ENDPOINTS
// ============================================================================

// File: src/api/store/products/[id]/route.ts

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;

  // Your existing product retrieval logic
  const product = await req.scope
    .resolve("product")
    .retrieve(id, { relations: ["variants"] });

  // Transform the product to include service fees
  const transformedProduct = ServiceFeeTransformer.transformProduct(product);

  return res.json({
    product: transformedProduct,
  });
}

// ============================================================================
// STEP 4: CUSTOM FEE CALCULATION (OPTIONAL)
// ============================================================================

// To use a different fee calculation strategy, edit:
// src/modules/service-fee/service-fee-transformer.ts
// Line: const serviceFee = computeServiceFee(variant);

// Change to any of these:
// - computeFixedServiceFee(variant, 100)      // Fixed amount
// - computeTieredServiceFee(variant)          // Percentage based on amount
// - computeQuantityBasedServiceFee(variant)   // Based on quantity

// ============================================================================
// STEP 5: TEST THE INTEGRATION
// ============================================================================

// Test API endpoint:
// GET http://localhost:9000/store/products

// Expected response structure:
// {
//   "products": [
//     {
//       "id": "prod_123",
//       "title": "Product Name",
//       "variants": [
//         {
//           "id": "var_123",
//           "title": "Small",
//           "calculated_amount": 1100,        // ← Includes service fee
//           "service_fee": 100,               // ← Service fee amount
//           "total_with_service_fee": 1100    // ← Clear total
//         }
//       ]
//     }
//   ]
// }

// ============================================================================
// STEP 6: CHANGE SERVICE FEE PERCENTAGE (IF NEEDED)
// ============================================================================

// File: src/modules/service-fee/utils/compute-service-fee.ts
// Line: const serviceFeePercentage = 0.1; // Change this value
// Example: 0.1 = 10%, 0.15 = 15%, 0.05 = 5%

// ============================================================================
// ADVANCED: SERVICE IN OTHER CONTEXTS
// ============================================================================

// Use the service directly in your backend code:

import { SERVICE_FEE_MODULE } from "@/modules/service-fee";

export async function myCustomFunction(req: MedusaRequest) {
  const serviceFeeService = req.scope.resolve(SERVICE_FEE_MODULE);

  // Transform single product
  const product = { id: "prod_1", variants: [] };
  const transformed = serviceFeeService.transformProduct(product);

  // Transform batch
  const products = [product];
  const transformedBatch = serviceFeeService.transformProducts(products);

  // Transform single variant
  const variant = { id: "var_1", calculated_amount: 1000 };
  const transformedVariant = serviceFeeService.transformVariant(variant);

  return transformed;
}

// ============================================================================
// FILE STRUCTURE REFERENCE
// ============================================================================

// service-fee/
// ├── index.ts                           ← Module definition
// ├── service.ts                         ← Service class with methods
// ├── service-fee-transformer.ts         ← Core transformation logic
// ├── utils/
// │   └── compute-service-fee.ts        ← Fee calculation functions
// ├── models/
// │   └── service-fee.ts                ← Database model
// ├── types/
// │   └── index.ts                      ← TypeScript types
// └── README.md                         ← Full documentation

// ============================================================================
// KEY EXPORTS
// ============================================================================

// From index.ts:
export {
  SERVICE_FEE_MODULE,               // Module identifier string
  ServiceFeeService,                // Service class
  ServiceFeeTransformer,            // Transformer class
  computeServiceFee,                // Default 10% fee calculation
  computeFixedServiceFee,           // Fixed amount calculation
  computeTieredServiceFee,          // Tiered percentage calculation
  computeQuantityBasedServiceFee,   // Per-unit calculation
};

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

// Issue: Service fee not appearing in API responses
// Solution: Make sure the transformer is applied to product routes

// Issue: Incorrect fee amounts
// Solution: Check the serviceFeePercentage value in compute-service-fee.ts

// Issue: TypeScript errors
// Solution: Ensure correct import paths and check tsconfig.json

// ============================================================================
// NEXT STEPS
// ============================================================================

// 1. Read the full README.md in this directory for comprehensive documentation
// 2. Review store-api-integration-example.ts for complete integration patterns
// 3. Test the module by running your Medusa server
// 4. Integrate into your Store API product routes
// 5. Monitor the API responses to verify fee calculations are correct
