# Service Fee Module

A complete Medusa v2 module that automatically calculates and applies service fees to product variants in the Store API.

## Overview

The Service Fee Module is a powerful backend solution that:

- ✅ Automatically transforms product variant `calculated_amount` fields
- ✅ Adds service fee information to each variant without frontend modifications
- ✅ Applies transformations globally via middleware
- ✅ Integrates seamlessly with the Medusa Store API
- ✅ Provides multiple fee calculation strategies (percentage, fixed, tiered, quantity-based)
- ✅ All logic is backend-side with zero frontend code changes required

## Module Structure

```
service-fee/
├── index.ts                              # Module definition and exports
├── service.ts                            # Service class with transformation methods
├── service-fee-transformer.ts            # Core transformer logic
├── utils/
│   └── compute-service-fee.ts           # Service fee calculation helpers
├── models/
│   └── service-fee.ts                   # Database model definition
├── types/
│   └── index.ts                         # TypeScript type definitions
├── migrations/                          # Database migrations
├── README.md                            # This file
└── store-api-integration-example.ts     # Integration examples
```

## Key Files

### 1. **service-fee-transformer.ts** (Core Transformer)
The main transformer that intercepts product API responses and applies service fees:

```typescript
// Single product transformation
ServiceFeeTransformer.transformProduct(product)

// Multiple products transformation
ServiceFeeTransformer.transformProducts(products)

// Single variant transformation
ServiceFeeTransformer.transformVariant(variant)

// Middleware for automatic application
ServiceFeeTransformer.createMiddleware()
```

**What it does:**
- Intercepts product responses from the Store API
- For each variant, calculates a service fee using `computeServiceFee()`
- Updates `calculated_amount` to include the service fee
- Adds a `service_fee` field with the fee amount
- Returns the enriched product data to the frontend

### 2. **utils/compute-service-fee.ts** (Fee Calculation)

Provides multiple strategies for calculating service fees:

#### Default Strategy (10% percentage)
```typescript
computeServiceFee(variant)
// Example: $100 calculated_amount → $10 service fee
// Result: calculated_amount becomes $110
```

#### Alternative Strategies

**Fixed Fee:**
```typescript
computeFixedServiceFee(variant, fixedAmount = 100)
// Charges a fixed amount regardless of the product price
```

**Tiered Fee:**
```typescript
computeTieredServiceFee(variant)
// 5% for amounts < $10
// 8% for amounts $10-$50
// 10% for amounts > $50
```

**Quantity-Based Fee:**
```typescript
computeQuantityBasedServiceFee(variant, feePerUnit = 50)
// Charges based on quantity: quantity × feePerUnit
```

### 3. **service.ts** (Service Class)

Provides methods to use the transformer:

```typescript
const serviceFeeService = req.scope.resolve(SERVICE_FEE_MODULE);

// Transform product
const product = await serviceFeeService.transformProduct(product);

// Transform batch
const products = await serviceFeeService.transformProducts(productArray);

// Transform variant
const variant = await serviceFeeService.transformVariant(variant);

// Get middleware for routes
const middleware = serviceFeeService.getTransformerMiddleware();
```

## How It Works

### Request/Response Flow

```
Frontend Request
     ↓
Store API Route (e.g., GET /store/products)
     ↓
Product Service retrieves data from database
     ↓
Service Fee Transformer intercepts response
     ↓
For each product:
  - For each variant:
    - Calculate fee: serviceFee = calculated_amount × 10%
    - Update: calculated_amount += serviceFee
    - Add: service_fee field to variant
     ↓
Transformed response sent to frontend
     ↓
Frontend receives adjusted calculated_amount values
```

## Integration Guide

### Option 1: Using Middleware in API Routes

In your Store API product routes:

```typescript
// src/api/store/products/route.ts
import ServiceFeeTransformer from "../../../modules/service-fee/service-fee-transformer";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Wrap with transformer middleware
  const middleware = ServiceFeeTransformer.createMiddleware();
  return middleware(req, res, async () => {
    // Your existing product endpoint logic
    const response = await getProducts(req); // your existing code
    return res.json(response);
  });
}
```

### Option 2: Direct Service Usage

In any backend code:

```typescript
import { SERVICE_FEE_MODULE } from "../../../modules/service-fee";

// In your route handler or service
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const serviceFeeService = req.scope.resolve(SERVICE_FEE_MODULE);
  
  const products = await getProductsFromDB();
  const transformedProducts = serviceFeeService.transformProducts(products);
  
  return res.json({ products: transformedProducts });
}
```

### Option 3: Per-Variant Transformation

For custom logic:

```typescript
import { computeServiceFee } from "../utils/compute-service-fee";

const variant = { calculated_amount: 1000 };
const fee = computeServiceFee(variant);
console.log(`Service fee: ${fee}`); // 100 (10% of 1000)
```

## Data Structure

### Input (Original Variant)
```json
{
  "id": "variant_123",
  "title": "Small",
  "calculated_amount": 1000,
  "quantity": 5
}
```

### Output (Transformed Variant)
```json
{
  "id": "variant_123",
  "title": "Small",
  "calculated_amount": 1100,
  "quantity": 5,
  "service_fee": 100,
  "total_with_service_fee": 1100
}
```

**Key Changes:**
- `calculated_amount`: 1000 → 1100 (includes service fee)
- `service_fee`: 100 (new field: the fee amount)
- `total_with_service_fee`: 1100 (explicit total for clarity)

## Configuration

### Changing the Service Fee Percentage

Edit the `computeServiceFee` function in `utils/compute-service-fee.ts`:

```typescript
// Change from 10% to 15%
const serviceFeePercentage = 0.15; // 15%
```

### Using a Different Calculation Strategy

Modify the `transformVariant` method in `service-fee-transformer.ts`:

```typescript
// Import your preferred strategy
import { computeTieredServiceFee } from "./utils/compute-service-fee";

static transformVariant(variant) {
  // Use tiered fee instead of default
  const serviceFee = computeTieredServiceFee(variant);
  // ... rest of logic
}
```

## API Response Examples

### Single Product Request
```
GET /store/products/prod_123

Response:
{
  "product": {
    "id": "prod_123",
    "title": "T-Shirt",
    "variants": [
      {
        "id": "var_123",
        "title": "Small",
        "calculated_amount": 3300,  // Original: 3000 + Service Fee: 300
        "service_fee": 300,
        "total_with_service_fee": 3300
      }
    ]
  }
}
```

### Product List Request
```
GET /store/products?limit=10

Response:
{
  "products": [
    {
      "id": "prod_123",
      "variants": [
        {
          "id": "var_123",
          "calculated_amount": 3300,
          "service_fee": 300,
          "total_with_service_fee": 3300
        }
      ]
    },
    // ... more products
  ],
  "count": 10,
  "offset": 0,
  "limit": 10
}
```

## Frontend Usage

**No frontend code changes required!** The frontend automatically receives adjusted amounts:

```javascript
// Frontend code (unchanged)
const variant = await medusaClient.products.variants.retrieve(variantId);
console.log(variant.calculated_amount); // Already includes service fee from backend
```

The service fee adjustment is completely transparent to the frontend because it happens at the API response level.

## Advanced: Custom Fee Logic

Create your own strategy:

```typescript
// src/modules/service-fee/utils/custom-fee-strategy.ts
export function computeCustomServiceFee(variant: any): number {
  // Your custom logic here
  const baseAmount = variant.calculated_amount || 0;
  
  // Example: Different fee based on variant properties
  if (variant.sku?.startsWith("PREMIUM")) {
    return Math.round(baseAmount * 0.15); // 15% for premium
  } else if (variant.sku?.startsWith("BUDGET")) {
    return Math.round(baseAmount * 0.05); // 5% for budget
  }
  
  return Math.round(baseAmount * 0.1); // 10% default
}
```

Then update the transformer to use it:

```typescript
import { computeCustomServiceFee } from "./utils/custom-fee-strategy";

// In ServiceFeeTransformer.transformVariant()
const serviceFee = computeCustomServiceFee(variant);
```

## Testing

### Unit Test Example
```typescript
import { computeServiceFee, computeTieredServiceFee } from "@/modules/service-fee/utils/compute-service-fee";
import ServiceFeeTransformer from "@/modules/service-fee/service-fee-transformer";

describe("Service Fee Module", () => {
  test("should calculate 10% service fee", () => {
    const variant = { calculated_amount: 1000 };
    const fee = computeServiceFee(variant);
    expect(fee).toBe(100);
  });

  test("should transform variant correctly", () => {
    const variant = { id: "var_1", calculated_amount: 1000 };
    const transformed = ServiceFeeTransformer.transformVariant(variant);
    
    expect(transformed.calculated_amount).toBe(1100);
    expect(transformed.service_fee).toBe(100);
    expect(transformed.total_with_service_fee).toBe(1100);
  });

  test("should apply tiered fees", () => {
    expect(computeTieredServiceFee({ calculated_amount: 500 })).toBe(25); // 5%
    expect(computeTieredServiceFee({ calculated_amount: 3000 })).toBe(240); // 8%
    expect(computeTieredServiceFee({ calculated_amount: 10000 })).toBe(1000); // 10%
  });
});
```

## Troubleshooting

### Service fee not showing in API responses

1. Verify the module is registered in `medusa-config.ts`
2. Check that middleware is applied to the product routes
3. Ensure `calculated_amount` is present in variant data

### Incorrect fee calculation

1. Check the `computeServiceFee` percentage value
2. Verify variant object has the `calculated_amount` field
3. Review custom fee logic if using a custom strategy

### TypeScript errors

Ensure you're importing from the correct paths:
```typescript
import { computeServiceFee } from "@/modules/service-fee/utils/compute-service-fee";
import ServiceFeeTransformer from "@/modules/service-fee/service-fee-transformer";
import { SERVICE_FEE_MODULE } from "@/modules/service-fee";
```

## Environment Variables

No environment variables required. The service fee rates are hardcoded in the computation functions.

To make rates configurable:

```typescript
// Create .env variables
SERVICE_FEE_PERCENTAGE=10
SERVICE_FEE_FIXED_AMOUNT=100

// Update compute-service-fee.ts
const percentage = parseFloat(process.env.SERVICE_FEE_PERCENTAGE || "10") / 100;
```

## Database

The module includes a database model for storing service fee configurations:

```typescript
// models/service-fee.ts
{
  id: string;
  display_name: string;
  fee_name: string;
  charging_level: ChargingLevel; // GLOBAL, ITEM_LEVEL, SHOP_LEVEL
  rate: number; // Fee percentage or amount
  eligibility_config: object; // Conditions for applying the fee
  valid_from: Date;
  valid_to: Date;
  status: ServiceFeeStatus; // ACTIVE, PENDING, INACTIVE
  date_created: Date;
}
```

## Performance Considerations

- Transformations are lightweight and synchronous
- Applied only to outgoing API responses
- No database queries required for transformation
- Suitable for high-traffic Store API endpoints

## Version Compatibility

- Medusa v2.0+
- Node.js 18+
- TypeScript 5.0+

## License

Same as the parent Medusa project

## Support

For issues or questions:
1. Check the integration examples in `store-api-integration-example.ts`
2. Review this README thoroughly
3. Check the code comments for detailed explanations
4. Refer to Medusa documentation: https://docs.medusajs.com
