import Service from "./service";
import { Module } from "@medusajs/framework/utils";

export const SERVICE_FEE_MODULE = "service_fee";

/**
 * Service Fee Module Configuration
 * 
 * This module automatically applies service fees to product variants in the Store API.
 * The transformer intercepts all product responses and:
 * 1. Calculates a service fee for each variant (default: 10% of calculated_amount)
 * 2. Adds the service_fee field to each variant
 * 3. Updates calculated_amount to include the service fee
 * 
 * All transformations happen on the backend before the response is sent to the frontend,
 * ensuring the Medusa SDK frontend receives the adjusted values automatically.
 */
export default Module(SERVICE_FEE_MODULE, {
  service: Service,
  loaders: [],
});

// Export the Service and Transformer for direct usage in API routes if needed
export { default as ServiceFeeService } from "./service";
export { default as ServiceFeeTransformer } from "./service-fee-transformer";
export { computeServiceFee, computeFixedServiceFee, computeTieredServiceFee, computeQuantityBasedServiceFee } from "./utils/compute-service-fee";

// Export types
export type { CreateServiceFee, ServiceFee } from "./types";

