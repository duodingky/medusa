import { MedusaService } from "@medusajs/framework/utils";
import { ServiceFee } from "./models/service-fee";
import ServiceFeeTransformer from "./service-fee-transformer";

class ServiceFeeModuleService extends MedusaService({
  ServiceFee,
}) {
  /**
   * Get the service fee transformer middleware for use in API routes
   * This middleware should be applied to product API endpoints to automatically
   * inject service fees into product variant calculated amounts
   */
  getTransformerMiddleware() {
    return ServiceFeeTransformer.createMiddleware();
  }

  /**
   * Transform a single product with service fees applied
   * @param product - The product to transform
   * @returns The transformed product with service fees added to variants
   */
  transformProduct(product: any) {
    return ServiceFeeTransformer.transformProduct(product);
  }

  /**
   * Transform multiple products with service fees applied
   * @param products - Array of products to transform
   * @returns Array of transformed products with service fees added to variants
   */
  transformProducts(products: any[]) {
    return ServiceFeeTransformer.transformProducts(products);
  }

  /**
   * Transform a single variant with service fee calculation
   * @param variant - The variant to transform
   * @returns The transformed variant with service fee information
   */
  transformVariant(variant: any) {
    return ServiceFeeTransformer.transformVariant(variant);
  }
}

export default ServiceFeeModuleService;
