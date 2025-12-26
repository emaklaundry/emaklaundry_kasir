import { Customer, PaymentMethod, PaymentStatus, Transaction } from '../types';

/**
 * Recalculate customer discount balances from transaction history
 * This utility processes all paid transactions and calculates the total rounding discount
 * that should have been earned by each customer
 * 
 * LOGIC:
 * - For each transaction, calculate expected subtotal without rounding: subtotal - tax
 * - Detect rounding discount by checking if discount exists and total is rounded to 500
 * - More robust than just checking total % 500 since total is already post-rounding
 */
export const recalculateAllCustomerDiscounts = async (
  customers: Customer[],
  transactions: Transaction[],
  updateCustomerFn: (id: string, data: Partial<Customer>) => Promise<unknown>,
): Promise<{
  updated: number;
  totalDiscountAdded: number;
  details: Array<{ customerId: string; customerName: string; discountAdded: number }>;
}> => {
  console.log('🔍 DEBUG: Starting recalculation');
  console.log(`📊 Total customers: ${customers.length}`);
  console.log(`📊 Total transactions: ${transactions.length}`);
  
  const results = {
    updated: 0,
    totalDiscountAdded: 0,
    details: [] as Array<{ customerId: string; customerName: string; discountAdded: number }>,
  };

  for (const customer of customers) {
    // Get ALL paid transactions for this customer (cash or otherwise)
    const paidTransactions = transactions.filter(
      (t) => t.customerId === customer.id && t.paymentStatus === PaymentStatus.Paid,
    );

    if (paidTransactions.length > 0) {
      console.log(`💰 Customer: ${customer.name} has ${paidTransactions.length} paid transactions`);
    }

    // Calculate total rounding discount from transaction history
    let totalRoundingDiscount = 0;

    paidTransactions.forEach((t) => {
      // Calculate what the total SHOULD be before rounding
      // subtotal - discount + tax = total
      // So: subtotal + tax - total = discount (including rounding)
      
      const expectedTotalWithoutRounding = t.subtotal - t.discount + t.tax;
      
      // Check if rounding was applied (total is multiple of 500 AND discount exists)
      if (t.total % 500 === 0 && t.discount > 0) {
        // Calculate the rounding component
        // If expected total has remainder, the difference is rounding discount
        const remainder = expectedTotalWithoutRounding % 500;
        
        if (remainder > 0 && remainder < 500) {
          console.log(
            `  ✅ Transaction: Expected Rp ${expectedTotalWithoutRounding.toLocaleString('id-ID')}, ` +
              `Actual Rp ${t.total.toLocaleString('id-ID')}, Discount Rp ${t.discount.toLocaleString('id-ID')}, ` +
              `Rounding: Rp ${remainder}`,
          );
          totalRoundingDiscount += remainder;
        }
      }
    });

    if (totalRoundingDiscount > 0) {
      console.log(
        `💵 ${customer.name}: Total rounding discount to add: Rp ${totalRoundingDiscount.toLocaleString('id-ID')}`,
      );
    }

    // Only update if there's discount to add
    if (totalRoundingDiscount > 0) {
      try {
        await updateCustomerFn(customer.id, { defaultDiscount: totalRoundingDiscount });
        results.updated++;
        results.totalDiscountAdded += totalRoundingDiscount;
        results.details.push({
          customerId: customer.id,
          customerName: customer.name,
          discountAdded: totalRoundingDiscount,
        });
        console.log(`✅ Updated ${customer.name} with Rp ${totalRoundingDiscount.toLocaleString('id-ID')}`);
      } catch (error) {
        console.error(`❌ Failed to update customer ${customer.name}:`, error);
      }
    }
  }

  console.log('✅ Recalculation complete:', results);
  console.log(
    `📊 Summary: ${results.updated} customers updated, total Rp ${results.totalDiscountAdded.toLocaleString('id-ID')}`,
  );
  return results;
};

/**
 * Calculate expected discount for a single customer from their transaction history
 */
export const calculateCustomerDiscount = (
  customerId: string,
  transactions: Transaction[],
): number => {
  const paidTransactions = transactions.filter(
    (t) => t.customerId === customerId && t.paymentStatus === PaymentStatus.Paid,
  );

  let totalRoundingDiscount = 0;

  paidTransactions.forEach((t) => {
    const expectedTotalWithoutRounding = t.subtotal - t.discount + t.tax;
    const remainder = expectedTotalWithoutRounding % 500;

    if (t.total % 500 === 0 && t.discount > 0 && remainder > 0 && remainder < 500) {
      totalRoundingDiscount += remainder;
    }
  });

  return totalRoundingDiscount;
};
