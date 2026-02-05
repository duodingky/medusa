/**
 * SERVICE FEE MODULE - USAGE EXAMPLES & TEST CASES
 * 
 * This file demonstrates various usage patterns and test cases for the Service Fee Module.
 */

// ============================================================================
// EXAMPLE 1: Calculate Service Fee for a Single Variant
// ============================================================================

import { computeServiceFee } from "./utils/compute-service-fee";

// Basic variant with calculated_amount
const variant1 = {
  id: "var_001",
  title: "Small",
  calculated_amount: 1000, // $10.00 (amount is in cents)
};

const fee1 = computeServiceFee(variant1);
console.log(`Variant fee: $${fee1 / 100} (10% of $10.00)`); // Output: $1.00

// ============================================================================
// EXAMPLE 2: Transform a Product with Multiple Variants
// ============================================================================

import ServiceFeeTransformer from "./service-fee-transformer";

const product = {
  id: "prod_001",
  title: "T-Shirt Collection",
  variants: [
    { id: "var_01", title: "Small", calculated_amount: 2000 },
    { id: "var_02", title: "Medium", calculated_amount: 2000 },
    { id: "var_03", title: "Large", calculated_amount: 2500 },
  ],
};

const transformedProduct = ServiceFeeTransformer.transformProduct(product);

console.log("Transformed Product:");
transformedProduct.variants.forEach((v: any) => {
  console.log(`  ${v.title}: $${v.calculated_amount / 100} (fee: $${v.service_fee / 100})`);
});
// Output:
//   Small: $22.00 (fee: $2.00)
//   Medium: $22.00 (fee: $2.00)
//   Large: $27.50 (fee: $2.50)

// ============================================================================
// EXAMPLE 3: Use Different Fee Calculation Strategies
// ============================================================================

import {
  computeFixedServiceFee,
  computeTieredServiceFee,
  computeQuantityBasedServiceFee,
} from "./utils/compute-service-fee";

const testVariant = {
  id: "var_test",
  calculated_amount: 5000, // $50.00
  quantity: 3,
};

// Percentage-based (10%)
console.log("Percentage Fee (10%):", computeServiceFee(testVariant)); // 500 ($5.00)

// Fixed fee ($1.00)
console.log("Fixed Fee ($1.00):", computeFixedServiceFee(testVariant, 100)); // 100

// Tiered fee (8% for $50)
console.log("Tiered Fee (8%):", computeTieredServiceFee(testVariant)); // 400 ($4.00)

// Quantity-based ($0.50 per unit)
console.log("Quantity Fee ($0.50×3):", computeQuantityBasedServiceFee(testVariant, 50)); // 150 ($1.50)

// ============================================================================
// EXAMPLE 4: Batch Transform Multiple Products
// ============================================================================

const products = [
  {
    id: "prod_001",
    title: "Product 1",
    variants: [{ id: "var_001", calculated_amount: 1000 }],
  },
  {
    id: "prod_002",
    title: "Product 2",
    variants: [
      { id: "var_101", calculated_amount: 2000 },
      { id: "var_102", calculated_amount: 3000 },
    ],
  },
];

const transformedProducts = ServiceFeeTransformer.transformProducts(products);
console.log(`Transformed ${transformedProducts.length} products`);
console.log(`Total products with variants:`, transformedProducts.flatMap((p: any) => p.variants).length);

// ============================================================================
// EXAMPLE 5: Transform Variant Only (for custom use cases)
// ============================================================================

const singleVariant = {
  id: "var_custom",
  title: "Custom Item",
  calculated_amount: 7500,
  custom_field: "preserve_me", // Custom fields are preserved
};

const transformedVariant = ServiceFeeTransformer.transformVariant(singleVariant);

console.log("Original amount:", singleVariant.calculated_amount);
console.log("Service fee:", transformedVariant.service_fee);
console.log("New amount:", transformedVariant.calculated_amount);
console.log("Custom field preserved:", transformedVariant.custom_field); // ✓ Preserved

// Output:
// Original amount: 7500
// Service fee: 750
// New amount: 8250
// Custom field preserved: preserve_me

// ============================================================================
// EXAMPLE 6: Use in API Route with Service Injection
// ============================================================================

// File: src/api/store/products/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SERVICE_FEE_MODULE } from "./index";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Get the service from DI container
  const serviceFeeService = req.scope.resolve(SERVICE_FEE_MODULE);
  const store = req.scope.resolve("store");

  // Retrieve products
  const products = await store.list(req.query);

  // Apply service fees
  const transformedProducts = serviceFeeService.transformProducts(products);

  return res.json({ products: transformedProducts });
}

// ============================================================================
// EXAMPLE 7: Cart Total with Service Fees
// ============================================================================

interface CartItem {
  variant_id: string;
  quantity: number;
  calculated_amount: number;
}

function calculateCartTotalWithServiceFees(cartItems: CartItem[]): {
  subtotal: number;
  totalServiceFee: number;
  total: number;
} {
  let subtotal = 0;
  let totalServiceFee = 0;

  cartItems.forEach((item) => {
    // Add to subtotal
    subtotal += item.calculated_amount;

    // Calculate service fee for this item
    const variant = { calculated_amount: item.calculated_amount };
    const fee = computeServiceFee(variant);
    totalServiceFee += fee;
  });

  return {
    subtotal,
    totalServiceFee,
    total: subtotal + totalServiceFee,
  };
}

// Usage
const cartItems: CartItem[] = [
  { variant_id: "var_001", quantity: 2, calculated_amount: 5000 },
  { variant_id: "var_002", quantity: 1, calculated_amount: 3000 },
];

const cartTotal = calculateCartTotalWithServiceFees(cartItems);
console.log("Cart Calculation:");
console.log(`  Subtotal:       $${cartTotal.subtotal / 100}`); // $80.00
console.log(`  Service Fees:   $${cartTotal.totalServiceFee / 100}`); // $8.00
console.log(`  Total:          $${cartTotal.total / 100}`); // $88.00

// ============================================================================
// EXAMPLE 8: Custom Variant Transformation with Extra Fields
// ============================================================================

const variantWithMeta = {
  id: "var_meta",
  title: "Premium Item",
  calculated_amount: 10000,
  region_id: "reg_001",
  currency_code: "USD",
  weight: 2.5,
};

const transformed = ServiceFeeTransformer.transformVariant(variantWithMeta);

console.log("Variant with Metadata - After Transform:");
console.log("  ID:", transformed.id);
console.log("  Title:", transformed.title);
console.log("  Original Amount: $" + (variantWithMeta.calculated_amount / 100));
console.log("  Service Fee: $" + ((transformed.service_fee || 0) / 100));
console.log("  New Amount: $" + (transformed.calculated_amount / 100));
console.log("  Region:", transformed.region_id);
console.log("  Weight:", transformed.weight);

// All metadata preserved ✓

// ============================================================================
// EXAMPLE 9: Comparison of Fee Strategies
// ============================================================================

const comparisonVariant = {
  id: "var_comparison",
  calculated_amount: 10000, // $100
  quantity: 2,
};

console.log("\nFee Strategy Comparison for $100 item:");
console.log("  Percentage (10%):", (computeServiceFee(comparisonVariant) / 100).toFixed(2));
console.log("  Fixed ($1):", (computeFixedServiceFee(comparisonVariant, 100) / 100).toFixed(2));
console.log("  Tiered (8-10%):", (computeTieredServiceFee(comparisonVariant) / 100).toFixed(2));
console.log("  Per Unit ($0.50):", (computeQuantityBasedServiceFee(comparisonVariant, 50) / 100).toFixed(2));

// ============================================================================
// EXAMPLE 10: Error Handling
// ============================================================================

// Handle undefined amounts
const emptyVariant = { id: "var_empty" };
const emptyFee = computeServiceFee(emptyVariant);
console.log("Fee for variant with no amount:", emptyFee); // 0

// Handle null/undefined variant fields
const nullVariant = {
  id: "var_null",
  calculated_amount: undefined,
  amount: null,
};
const nullFee = computeServiceFee(nullVariant);
console.log("Fee for variant with null amount:", nullFee); // 0

// ============================================================================
// UNIT TEST EXAMPLES
// ============================================================================

// Test: Basic fee calculation
function testBasicFeeCalculation() {
  const variant = { calculated_amount: 1000 };
  const fee = computeServiceFee(variant);
  console.assert(fee === 100, "Fee should be 100 (10% of 1000)");
  console.log("✓ Basic fee calculation test passed");
}

// Test: Variant transformation
function testVariantTransformation() {
  const variant = { id: "var_1", calculated_amount: 1000 };
  const transformed = ServiceFeeTransformer.transformVariant(variant);
  
  console.assert(transformed.calculated_amount === 1100, "Amount should include fee");
  console.assert(transformed.service_fee === 100, "Service fee should be 100");
  console.assert(transformed.id === "var_1", "ID should be preserved");
  console.log("✓ Variant transformation test passed");
}

// Test: Tiered fees
function testTieredFees() {
  console.assert(computeTieredServiceFee({ calculated_amount: 500 }) === 25, "5% tier");
  console.assert(computeTieredServiceFee({ calculated_amount: 3000 }) === 240, "8% tier");
  console.assert(computeTieredServiceFee({ calculated_amount: 10000 }) === 1000, "10% tier");
  console.log("✓ Tiered fee tests passed");
}

// Run tests
testBasicFeeCalculation();
testVariantTransformation();
testTieredFees();
console.log("\n✅ All examples and tests completed");
