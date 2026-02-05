import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { ProductVariantDTO } from "@medusajs/types";
import { computeServiceFee } from "./compute-service-fee";

/**
 * Interface for a product response from the Store API
 */
interface ProductResponse {
  id: string;
  title: string;
  variants?: VariantWithCalculatedAmount[];
  [key: string]: any;
}

/**
 * Extended variant interface that includes calculated_amount
 */
interface VariantWithCalculatedAmount extends ProductVariantDTO {
  calculated_amount?: number;
  amount?: number;
  service_fee?: number;
  total_with_service_fee?: number;
}

/**
 * Transformer that intercepts product API responses and adds service fees to variants
 * This transformer is applied globally in the module's request/response lifecycle
 */
export class ServiceFeeTransformer {
  /**
   * Transform a single product response by adding service fees to all variants
   * @param product - The product object to transform
   * @returns The transformed product with service fees applied to variants
   */
  static transformProduct(product: ProductResponse): ProductResponse {
    if (!product.variants || !Array.isArray(product.variants)) {
      return product;
    }

    // Transform each variant
    product.variants = product.variants.map((variant) =>
      this.transformVariant(variant as VariantWithCalculatedAmount)
    );

    return product;
  }

  /**
   * Transform a single variant by calculating and adding the service fee
   * @param variant - The variant to transform
   * @returns The transformed variant with service fee information
   */
  static transformVariant(
    variant: VariantWithCalculatedAmount
  ): VariantWithCalculatedAmount {
    // Calculate the service fee
    const serviceFee = computeServiceFee(variant);

    // Add service fee information to the variant
    const transformedVariant = {
      ...variant,
      service_fee: serviceFee,
    };

    // Optionally: Update the calculated_amount to include the service fee
    // This ensures the frontend receives the final amount directly
    if (variant.calculated_amount !== undefined) {
      transformedVariant.calculated_amount = variant.calculated_amount + serviceFee;
      transformedVariant.total_with_service_fee = variant.calculated_amount + serviceFee;
    } else if (variant.amount !== undefined) {
      const originalAmount = variant.amount;
      transformedVariant.amount = originalAmount + serviceFee;
      transformedVariant.calculated_amount = originalAmount + serviceFee;
      transformedVariant.total_with_service_fee = originalAmount + serviceFee;
    }

    return transformedVariant;
  }

  /**
   * Transform multiple products (batch operation)
   * @param products - Array of products to transform
   * @returns Array of transformed products
   */
  static transformProducts(products: ProductResponse[]): ProductResponse[] {
    return products.map((product) => this.transformProduct(product));
  }

  /**
   * Express middleware to apply the transformer to API responses
   * This middleware wraps the response and transforms product data before sending to client
   */
  static createMiddleware() {
    return async (req: MedusaRequest, res: MedusaResponse, next: Function) => {
      // Store the original json method
      const originalJson = res.json.bind(res);

      // Override the json method to apply transformations
      res.json = function (body: any) {
        // Check if the response contains products
        if (body) {
          if (body.product) {
            // Single product response
            body.product = ServiceFeeTransformer.transformProduct(body.product);
          } else if (body.products && Array.isArray(body.products)) {
            // Multiple products response
            body.products = ServiceFeeTransformer.transformProducts(body.products);
          }
        }

        // Call the original json method with the transformed body
        return originalJson(body);
      };

      next();
    };
  }
}

export default ServiceFeeTransformer;
