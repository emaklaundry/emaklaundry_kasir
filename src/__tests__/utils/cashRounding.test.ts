import { describe, it, expect } from 'vitest';

/**
 * Unit Tests for Cash Rounding Logic
 * 
 * Business Rules:
 * - Rounding only applies to Cash payment method
 * - Minimum rounding is 500 rupiah
 * - Always round DOWN to nearest 500
 * - Remainder becomes customer's discount balance
 */

describe('Cash Rounding Logic', () => {
  // Helper function to calculate rounding (mirrors PaymentModal logic)
  const calculateRounding = (amount: number, paymentMethod: 'Cash' | 'Transfer' | 'E-Wallet') => {
    const remainder = amount % 500;
    const shouldRound = paymentMethod === 'Cash' && remainder > 0;
    const roundedAmount = shouldRound ? amount - remainder : amount;
    const bonus = shouldRound ? remainder : 0;
    
    return { roundedAmount, bonus };
  };

  describe('Cash Payment - Should Round', () => {
    it('should round Rp 10,350 down to Rp 10,000 with Rp 350 bonus', () => {
      const result = calculateRounding(10350, 'Cash');
      expect(result.roundedAmount).toBe(10000);
      expect(result.bonus).toBe(350);
    });

    it('should round Rp 10,750 down to Rp 10,500 with Rp 250 bonus', () => {
      const result = calculateRounding(10750, 'Cash');
      expect(result.roundedAmount).toBe(10500);
      expect(result.bonus).toBe(250);
    });

    it('should round Rp 10,100 down to Rp 10,000 with Rp 100 bonus', () => {
      const result = calculateRounding(10100, 'Cash');
      expect(result.roundedAmount).toBe(10000);
      expect(result.bonus).toBe(100);
    });

    it('should round Rp 10,499 down to Rp 10,000 with Rp 499 bonus (max bonus)', () => {
      const result = calculateRounding(10499, 'Cash');
      expect(result.roundedAmount).toBe(10000);
      expect(result.bonus).toBe(499);
    });

    it('should round Rp 127,650 down to Rp 127,500 with Rp 150 bonus', () => {
      const result = calculateRounding(127650, 'Cash');
      expect(result.roundedAmount).toBe(127500);
      expect(result.bonus).toBe(150);
    });
  });

  describe('Cash Payment - No Rounding Needed', () => {
    it('should NOT round Rp 10,000 (already divisible by 500)', () => {
      const result = calculateRounding(10000, 'Cash');
      expect(result.roundedAmount).toBe(10000);
      expect(result.bonus).toBe(0);
    });

    it('should NOT round Rp 10,500 (already divisible by 500)', () => {
      const result = calculateRounding(10500, 'Cash');
      expect(result.roundedAmount).toBe(10500);
      expect(result.bonus).toBe(0);
    });

    it('should NOT round Rp 11,000 (already divisible by 500)', () => {
      const result = calculateRounding(11000, 'Cash');
      expect(result.roundedAmount).toBe(11000);
      expect(result.bonus).toBe(0);
    });

    it('should NOT round Rp 500 (edge case minimum)', () => {
      const result = calculateRounding(500, 'Cash');
      expect(result.roundedAmount).toBe(500);
      expect(result.bonus).toBe(0);
    });
  });

  describe('Transfer Payment - Never Round', () => {
    it('should NOT round Rp 10,350 for Transfer payment', () => {
      const result = calculateRounding(10350, 'Transfer');
      expect(result.roundedAmount).toBe(10350);
      expect(result.bonus).toBe(0);
    });

    it('should NOT round Rp 10,750 for Transfer payment', () => {
      const result = calculateRounding(10750, 'Transfer');
      expect(result.roundedAmount).toBe(10750);
      expect(result.bonus).toBe(0);
    });

    it('should NOT round Rp 10,100 for Transfer payment', () => {
      const result = calculateRounding(10100, 'Transfer');
      expect(result.roundedAmount).toBe(10100);
      expect(result.bonus).toBe(0);
    });
  });

  describe('E-Wallet Payment - Never Round', () => {
    it('should NOT round Rp 10,350 for E-Wallet payment', () => {
      const result = calculateRounding(10350, 'E-Wallet');
      expect(result.roundedAmount).toBe(10350);
      expect(result.bonus).toBe(0);
    });

    it('should NOT round Rp 10,750 for E-Wallet payment', () => {
      const result = calculateRounding(10750, 'E-Wallet');
      expect(result.roundedAmount).toBe(10750);
      expect(result.bonus).toBe(0);
    });

    it('should NOT round Rp 127,650 for E-Wallet payment', () => {
      const result = calculateRounding(127650, 'E-Wallet');
      expect(result.roundedAmount).toBe(127650);
      expect(result.bonus).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle Rp 0 for Cash', () => {
      const result = calculateRounding(0, 'Cash');
      expect(result.roundedAmount).toBe(0);
      expect(result.bonus).toBe(0);
    });

    it('should handle Rp 1 for Cash (rounds to 0 with 1 bonus)', () => {
      const result = calculateRounding(1, 'Cash');
      expect(result.roundedAmount).toBe(0);
      expect(result.bonus).toBe(1);
    });

    it('should handle very large amounts for Cash', () => {
      const result = calculateRounding(1000000, 'Cash');
      expect(result.roundedAmount).toBe(1000000);
      expect(result.bonus).toBe(0);
    });

    it('should handle very large amounts with remainder for Cash', () => {
      const result = calculateRounding(1000350, 'Cash');
      expect(result.roundedAmount).toBe(1000000);
      expect(result.bonus).toBe(350);
    });
  });

  describe('Rounding Formula Validation', () => {
    it('should always satisfy: original = rounded + bonus', () => {
      const testCases = [10350, 10750, 10100, 127650, 10499];
      
      testCases.forEach(amount => {
        const result = calculateRounding(amount, 'Cash');
        expect(result.roundedAmount + result.bonus).toBe(amount);
      });
    });

    it('should ensure rounded amount is always divisible by 500 or equal to original', () => {
      const testCases = [10350, 10750, 10100, 11000, 10500];
      
      testCases.forEach(amount => {
        const result = calculateRounding(amount, 'Cash');
        const isDivisibleBy500 = result.roundedAmount % 500 === 0;
        const isOriginal = result.roundedAmount === amount;
        
        expect(isDivisibleBy500 || isOriginal).toBe(true);
      });
    });

    it('should ensure bonus is always < 500', () => {
      const testCases = [10350, 10750, 10100, 10499, 127650];
      
      testCases.forEach(amount => {
        const result = calculateRounding(amount, 'Cash');
        expect(result.bonus).toBeLessThan(500);
        expect(result.bonus).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
