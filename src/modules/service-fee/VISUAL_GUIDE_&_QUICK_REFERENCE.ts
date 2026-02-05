/**
 * SERVICE FEE MODULE - VISUAL GUIDE & QUICK REFERENCE
 * 
 * Visual diagrams and reference tables for the Service Fee Module
 */

// ============================================================================
// 📊 MODULE ARCHITECTURE AT A GLANCE
// ============================================================================

/*
┌─────────────────────────────────────────────────────────────────────────┐
│                      MEDUSA STORE API REQUEST                           │
│                     (e.g., GET /store/products)                         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────────┐
                    │  Your API Route Handler   │
                    │  (stores/products/route.ts)
                    └───────────┬───────────────┘
                                │
                                ▼
                    ┌───────────────────────────┐
                    │  Fetch Products from DB   │
                    │  (remoteQuery, service)   │
                    └───────────┬───────────────┘
                                │
                                ▼
              ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
              ┃   SERVICE FEE MODULE (★KEY)   ┃  ← Apply transformation here
              ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
              ┃ ServiceFeeTransformer.        ┃
              ┃   transformProducts(products) ┃
              ┃                               ┃
              ┃ For each product:             ┃
              ┃ └─→ For each variant:         ┃
              ┃     ├─→ Calculate fee         ┃
              ┃     │   computeServiceFee()   ┃
              ┃     │   = amt × 10%           ┃
              ┃     ├─→ Add service_fee field ┃
              ┃     └─→ Update calculated_amt ┃
              ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                │
                                ▼
                    ┌───────────────────────────┐
                    │  Return JSON Response     │
                    │  {                        │
                    │    products: [            │
                    │      {                    │
                    │        variants: [{       │
                    │          calculated...   │
                    │          service_fee...  │
                    │        }]                 │
                    │      }                    │
                    │    ]                      │
                    │  }                        │
                    └───────────┬───────────────┘
                                │
                                ▼
                    ┌───────────────────────────┐
                    │   Frontend/SDK Receives   │
                    │   Adjusted Amounts Ready! │
                    └───────────────────────────┘
*/

// ============================================================================
// 📁 FILE STRUCTURE OVERVIEW
// ============================================================================

/*
service-fee/
│
├─ 🌟 CORE FILES (What you use)
│  ├─ index.ts                                [Module definition]
│  ├─ service.ts                              [Service class]
│  └─ service-fee-transformer.ts              [Core transformation logic]
│
├─ 🔧 UTILITIES (Helper functions)
│  └─ utils/
│     └─ compute-service-fee.ts               [Fee calculation strategies]
│
├─ 💾 DATA LAYER (Database & Types)
│  ├─ models/
│  │  └─ service-fee.ts                       [Database model]
│  ├─ types/
│  │  └─ index.ts                             [TypeScript interfaces]
│  └─ migrations/
│     └─ [Version]service-fee.ts              [DB migrations]
│
└─ 📚 DOCUMENTATION (Learn & Reference)
   ├─ README.md                              [Complete guide]
   ├─ QUICK_START.ts                         [5-minute setup]
   ├─ INTEGRATION_GUIDE.ts                   [10 integration methods]
   ├─ EXAMPLES_AND_TESTS.ts                  [Code examples]
   ├─ ARCHITECTURE_&_API_REFERENCE.ts        [API reference]
   ├─ REAL_WORLD_IMPLEMENTATION.ts           [Production examples]
   ├─ COMPREHENSIVE_SUMMARY.md               [Executive summary]
   ├─ store-api-integration-example.ts       [Route examples]
   └─ VISUAL_GUIDE_&_QUICK_REFERENCE.ts      [This file]
*/

// ============================================================================
// 🔀 DATA TRANSFORMATION FLOW
// ============================================================================

/*
INPUT VARIANT:
┌──────────────────────────────────────┐
│ {                                    │
│   id: "var_001"                      │
│   title: "Small"                     │
│   sku: "TSHIRT-SM"                   │
│   calculated_amount: 1000            │  ← This gets modified
│   quantity: 5                        │
│ }                                    │
└──────────────────┬───────────────────┘
                   │
             SERVICE FEE TRANSFORMER
                   │
                   ├─→ Detect calculated_amount: 1000
                   ├─→ Calculate fee: 1000 × 0.10 = 100 ✓
                   ├─→ Update: calculated_amount = 1100 ✓
                   └─→ Add fields: service_fee = 100 ✓
                   
OUTPUT VARIANT:
┌──────────────────────────────────────┐
│ {                                    │
│   id: "var_001"                      │
│   title: "Small"                     │
│   sku: "TSHIRT-SM"                   │
│   calculated_amount: 1100            │  ← UPDATED ✓
│   quantity: 5                        │
│   service_fee: 100                   │  ← ADDED ✓
│   total_with_service_fee: 1100       │  ← ADDED ✓
│ }                                    │
└──────────────────────────────────────┘
*/

// ============================================================================
// 🎯 COMMON USE CASES - QUICK REFERENCE
// ============================================================================

/*
┌────────────────────┬────────────────────────────┬──────────────────────┐
│ USE CASE           │ EXAMPLE CODE               │ FILE REFERENCE       │
├────────────────────┼────────────────────────────┼──────────────────────┤
│ Transform          │ ServiceFeeTransformer.     │ QUICK_START.ts       │
│ products in        │ transformProducts(         │ lines 20-40           │
│ API route          │   products                 │                      │
│                    │ )                          │                      │
├────────────────────┼────────────────────────────┼──────────────────────┤
│ Get fee amount     │ const fee =                │ EXAMPLES_AND_TESTS  │
│ for a variant      │ computeServiceFee(         │ lines 15-25          │
│                    │   { calculated_amount }   │                      │
│                    │ )                          │                      │
├────────────────────┼────────────────────────────┼──────────────────────┤
│ Use dependency     │ const svc = req.scope      │ REAL_WORLD_IMPL     │
│ injection          │ .resolve(SERVICE_FEE...)   │ lines 120-130        │
├────────────────────┼────────────────────────────┼──────────────────────┤
│ Apply as           │ const middleware =         │ REAL_WORLD_IMPL     │
│ middleware         │ .createMiddleware()        │ lines 200-220        │
├────────────────────┼────────────────────────────┼──────────────────────┤
│ Use different      │ const fee =                │ EXAMPLES_AND_TESTS  │
│ fee strategy       │ computeTieredServiceFee()  │ lines 50-70          │
├────────────────────┼────────────────────────────┼──────────────────────┤
│ Apply to cart      │ transformedCart.items =    │ REAL_WORLD_IMPL     │
│ items              │ items.map(i =>             │ lines 180-195        │
│                    │   transformVariant()       │                      │
│                    │ )                          │                      │
├────────────────────┼────────────────────────────┼──────────────────────┤
│ Conditional        │ if (shouldApplyFee(p))    │ REAL_WORLD_IMPL     │
│ application        │   transform(p)             │ lines 260-280        │
└────────────────────┴────────────────────────────┴──────────────────────┘
*/

// ============================================================================
// 📊 FEE CALCULATION STRATEGIES COMPARISON
// ============================================================================

/*
Strategy           | Formula              | Example ($100)  | Best For
─────────────────────────────────────────────────────────────────────────
Percentage         | amount × 10%         | $100 → $10 fee  | Most use cases
(DEFAULT)          |                      |                 |
───────────────────┼──────────────────────┼─────────────────┼──────────────
Fixed Amount       | $1.00 flat           | $100 → $1 fee   | All items equal
───────────────────┼──────────────────────┼─────────────────┼──────────────
Tiered             | Amount-based %       | $100 → $8 fee   | Dynamic pricing
                   | <$10: 5%             | (8% tier)       |
                   | $10-50: 8%           |                 |
                   | >$50: 10%            |                 |
───────────────────┼──────────────────────┼─────────────────┼──────────────
Quantity-Based     | quantity × $0.50     | 3 units → $1.50 | Per-unit fees
                   |                      | fee             |
───────────────────┼──────────────────────┼─────────────────┼──────────────
Custom             | Your logic           | Your calc       | Specific
                   | (implement)          |                 | requirements
*/

// ============================================================================
// 🔄 INTEGRATION PATHS - CHOOSE YOUR METHOD
// ============================================================================

/*
┌─────────────────────────────────────────────────────────────────────────┐
│ METHOD 1: Direct Transformer (Simplest)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  const products = await getProducts();                                 │
│  const transformed = ServiceFeeTransformer.transformProducts(products);│
│  return res.json({ products: transformed });                           │
│                                                                         │
│  ✓ Easy to understand                                                  │
│  ✓ Minimal code                                                        │
│  ✗ Requires manual application in each route                           │
│                                                                         │
│  File: QUICK_START.ts, lines 20-40                                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ METHOD 2: Service Injection (Best Practice)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  const serviceFeeService = req.scope.resolve(SERVICE_FEE_MODULE);      │
│  const transformed = serviceFeeService.transformProducts(products);    │
│  return res.json({ products: transformed });                           │
│                                                                         │
│  ✓ Uses DI container                                                   │
│  ✓ Testable                                                            │
│  ✓ Medusa standard pattern                                             │
│  ✗ Slightly more code                                                  │
│                                                                         │
│  File: REAL_WORLD_IMPLEMENTATION.ts, lines 50-100                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ METHOD 3: Middleware (Most Comprehensive)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  const middleware = ServiceFeeTransformer.createMiddleware();          │
│  app.use("/store/products", middleware);                               │
│                                                                         │
│  ✓ Automatic for all routes                                            │
│  ✓ Single setup point                                                  │
│  ✓ Blanket coverage                                                    │
│  ✗ Less granular control                                               │
│                                                                         │
│  File: INTEGRATION_GUIDE.ts, lines 200-250                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ METHOD 4: Business Logic Service (Most Flexible)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  const productService = new ProductWithFeesService(req);               │
│  const products = await productService.getProducts(...);               │
│                                                                         │
│  ✓ Encapsulates business logic                                         │
│  ✓ Reusable across multiple routes                                     │
│  ✓ Easy to test                                                        │
│  ✓ Conditional application easy                                        │
│  ✗ More setup code                                                     │
│                                                                         │
│  File: REAL_WORLD_IMPLEMENTATION.ts, lines 250-350                     │
└─────────────────────────────────────────────────────────────────────────┘
*/

// ============================================================================
// 📈 RESPONSE STRUCTURE - BEFORE & AFTER
// ============================================================================

/*
BEFORE TRANSFORMATION:
──────────────────────

{
  "products": [
    {
      "id": "prod_123",
      "title": "T-Shirt",
      "variants": [
        {
          "id": "var_001",
          "title": "Small",
          "calculated_amount": 1000
        },
        {
          "id": "var_002",
          "title": "Large",
          "calculated_amount": 1200
        }
      ]
    }
  ]
}

                              │
                              │ ServiceFeeTransformer applies
                              │
                              ▼

AFTER TRANSFORMATION:
─────────────────────

{
  "products": [
    {
      "id": "prod_123",
      "title": "T-Shirt",
      "variants": [
        {
          "id": "var_001",
          "title": "Small",
          "calculated_amount": 1100,        ← 1000 + 100 fee
          "service_fee": 100,               ← NEW
          "total_with_service_fee": 1100    ← NEW
        },
        {
          "id": "var_002",
          "title": "Large",
          "calculated_amount": 1320,        ← 1200 + 120 fee
          "service_fee": 120,               ← NEW
          "total_with_service_fee": 1320    ← NEW
        }
      ]
    }
  ]
}

KEY CHANGES:
✓ calculated_amount: Updated to include service fee
✓ service_fee: New field showing the fee amount
✓ total_with_service_fee: New field for clarity
✓ All other fields: Preserved unchanged
*/

// ============================================================================
// 🚀 QUICK DECISION MATRIX
// ============================================================================

/*
Do you want to:

┌─ Transform just one route?
│  └─→ Use METHOD 1 (Direct Transformer) - QUICK_START.ts
│
├─ Follow Medusa best practices?
│  └─→ Use METHOD 2 (Service Injection) - REAL_WORLD_IMPLEMENTATION.ts
│
├─ Apply to ALL product routes automatically?
│  └─→ Use METHOD 3 (Middleware) - INTEGRATION_GUIDE.ts
│
├─ Build a reusable service layer?
│  └─→ Use METHOD 4 (Business Logic Service) - REAL_WORLD_IMPLEMENTATION.ts
│
├─ Try some examples first?
│  └─→ See EXAMPLES_AND_TESTS.ts
│
├─ Understand the architecture?
│  └─→ See ARCHITECTURE_&_API_REFERENCE.ts
│
└─ Get started in 5 minutes?
   └─→ See QUICK_START.ts
*/

// ============================================================================
// 🔍 DEBUGGING & TROUBLESHOOTING QUICK REFERENCE
// ============================================================================

/*
Problem                          │ Solution
─────────────────────────────────┼──────────────────────────────────────
Service fee not in response       │ Check transformer is called in route
                                  │ See: QUICK_START.ts line 25
                                  │
Incorrect fee amount              │ Verify percentage in compute-service-fee.ts
                                  │ Default: 0.1 (10%)
                                  │ Check: calculated_amount is in cents
                                  │
Module not found error            │ Verify path: src/modules/service-fee
                                  │ Check: medusa-config.ts registration
                                  │
TypeScript errors on import       │ Verify import paths match project structure
                                  │ Update: Based on your tsconfig baseUrl
                                  │
API returns 500 error             │ Check: Try/catch in route handler
                                  │ See: REAL_WORLD_IMPLEMENTATION.ts
                                  │
Frontend not showing fees         │ Verify API response has service_fee field
                                  │ Test: curl http://localhost:9000/store/products
                                  │
Performance degradation           │ Transformation is lightweight (< 1ms)
                                  │ Check: Other bottlenecks first
                                  │ Profile: Your route handlers
*/

// ============================================================================
// 📞 WHERE TO FIND WHAT YOU NEED
// ============================================================================

/*
I want to...                     │ Go to...
──────────────────────────────────┼────────────────────────────────────
Get started in 5 minutes          │ QUICK_START.ts
                                  │
See working code examples         │ EXAMPLES_AND_TESTS.ts
                                  │ REAL_WORLD_IMPLEMENTATION.ts
                                  │
Understand the architecture       │ ARCHITECTURE_&_API_REFERENCE.ts
                                  │
Learn all integration methods     │ INTEGRATION_GUIDE.ts
                                  │
Set up in my actual project       │ REAL_WORLD_IMPLEMENTATION.ts
                                  │
Test the module                   │ EXAMPLES_AND_TESTS.ts
                                  │
Reference the API                 │ ARCHITECTURE_&_API_REFERENCE.ts
                                  │
Learn how it works                │ COMPREHENSIVE_SUMMARY.md
                                  │
Troubleshoot issues               │ README.md (Troubleshooting section)
                                  │
See code examples                 │ store-api-integration-example.ts
*/

// ============================================================================
// ✅ IMPLEMENTATION CHECKLIST
// ============================================================================

/*
Phase 1: Understanding (30 mins)
□ Read COMPREHENSIVE_SUMMARY.md
□ Review QUICK_START.ts
□ Understand the data transformation flow

Phase 2: Planning (15 mins)
□ Identify which routes need service fees
□ Choose integration method (1, 2, 3, or 4)
□ Plan fee percentage/strategy

Phase 3: Implementation (1-2 hours)
□ Add transformer to your route(s)
□ Test via API endpoint
□ Verify response structure
□ Check calculated_amount includes fee

Phase 4: Customization (As needed)
□ Adjust fee percentage if needed
□ Consider conditional application
□ Implement custom calculation if needed

Phase 5: Testing (1-2 hours)
□ Test single products
□ Test product lists
□ Test with cart/checkout
□ Test with frontend SDK
□ Performance testing

Phase 6: Deployment (30 mins)
□ Code review
□ Final testing
□ Deploy to staging
□ Deploy to production
□ Monitor for issues

Total time: 4-6 hours for full integration
*/

// ============================================================================
// 🎯 SUCCESS CRITERIA
// ============================================================================

/*
You'll know it's working when:
✓ API returns product variants with calculated_amount increased
✓ Response includes service_fee field with fee amount
✓ Frontend receives adjusted amounts directly from API
✓ No frontend code changes needed
✓ Tests pass with expected fee calculations
✓ API performance is not degraded (< 5% increase)

Example successful response:
{
  "product": {
    "variants": [
      {
        "id": "var_123",
        "calculated_amount": 1100,  ← INCREASED ✓
        "service_fee": 100,         ← PRESENT ✓
        "total_with_service_fee": 1100  ← ADDED ✓
      }
    ]
  }
}
*/
