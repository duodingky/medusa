/**
 * Helper function to compute the service fee for a product variant
 * @param variant - The product variant object
 * @returns The service fee amount (default: 10% of the calculated_amount)
 */
export function computeServiceFee(variant: {
  calculated_amount?: number;
  amount?: number;
  [key: string]: any;
}): number {
  // Get the base amount from calculated_amount or amount field
  const baseAmount = variant.calculated_amount || variant.amount || 0;

  // Calculate service fee as 10% of the base amount
  const serviceFeePercentage = 0.1; // 10%
  const serviceFee = Math.round(baseAmount * serviceFeePercentage);

  return serviceFee;
}

/**
 * Alternative computation strategies that can be used
 */

// Fixed fee per item
export function computeFixedServiceFee(variant: any, fixedAmount: number = 100): number {
  return fixedAmount;
}

// Tiered service fee based on amount
export function computeTieredServiceFee(variant: any): number {
  const baseAmount = variant.calculated_amount || variant.amount || 0;

  if (baseAmount < 1000) {
    return Math.round(baseAmount * 0.05); // 5%
  } else if (baseAmount < 5000) {
    return Math.round(baseAmount * 0.08); // 8%
  } else {
    return Math.round(baseAmount * 0.1); // 10%
  }
}

// Service fee based on quantity
export function computeQuantityBasedServiceFee(
  variant: any,
  feePerUnit: number = 50
): number {
  const quantity = variant.quantity || 1;
  return feePerUnit * quantity;
}
