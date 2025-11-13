import { useState, useMemo, useEffect } from 'react';
import { PaymentStatus, PaymentMethod, UserRole, Customer, TransactionItem, Service } from '@/types';
import { formatRupiah, parseRupiah } from '@/utils/formatting';

interface UseTransactionFormProps {
  currentUser: any;
  settings: any;
  services: Service[];
}

export function useTransactionForm({ currentUser, settings, services }: UseTransactionFormProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [notes, setNotes] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [isPayingNow, setIsPayingNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [amountPaidStr, setAmountPaidStr] = useState('0');
  const [tenderedAmountStr, setTenderedAmountStr] = useState('');

  const canApplyDiscount = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.SuperAdmin) return true;
    if ((currentUser.role === UserRole.BranchAdmin || currentUser.role === UserRole.Cashier)) {
      if (currentUser.canGiveDiscount) return true;
      if (selectedCustomer && selectedCustomer.defaultDiscount && selectedCustomer.defaultDiscount > 0) return true;
    }
    return false;
  }, [currentUser, selectedCustomer]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.subtotal, 0), [items]);

  const discountAmount = useMemo(() => {
    if (!canApplyDiscount) return 0;
    if (discountType === 'percent') {
      return subtotal * (discountValue / 100);
    }
    return Math.min(discountValue, subtotal);
  }, [subtotal, discountValue, discountType, canApplyDiscount]);

  const taxAmount = useMemo(() => {
    const taxableAmount = subtotal - discountAmount;
    return taxableAmount * ((settings?.taxRate ?? 0) / 100);
  }, [subtotal, discountAmount, settings?.taxRate]);

  const grandTotal = useMemo(() => subtotal - discountAmount + taxAmount, [subtotal, discountAmount, taxAmount]);

  useEffect(() => {
    if (isPayingNow) {
      setAmountPaidStr(formatRupiah(grandTotal));
    }
  }, [grandTotal, isPayingNow]);

  const amountToPay = useMemo(() => parseRupiah(amountPaidStr), [amountPaidStr]);
  const tenderedAmount = useMemo(() => parseRupiah(tenderedAmountStr), [tenderedAmountStr]);

  const changeAmount = useMemo(() => {
    if (!isPayingNow || paymentMethod !== PaymentMethod.Cash || tenderedAmount < amountToPay) {
      return 0;
    }
    return tenderedAmount - amountToPay;
  }, [isPayingNow, paymentMethod, tenderedAmount, amountToPay]);

  const actualAmountPaid = useMemo(() => {
    if (!isPayingNow) return 0;
    return amountToPay;
  }, [isPayingNow, amountToPay]);

  const paymentStatus = useMemo(() => {
    if (!isPayingNow) return PaymentStatus.Unpaid;
    if (grandTotal <= 0) return PaymentStatus.Paid;
    if (actualAmountPaid <= 0) return PaymentStatus.Unpaid;
    if (actualAmountPaid >= grandTotal) return PaymentStatus.Paid;
    return PaymentStatus.PartiallyPaid;
  }, [isPayingNow, actualAmountPaid, grandTotal]);

  const estimatedCompletionDate = useMemo(() => {
    if (items.length === 0) {
      const today = new Date();
      today.setDate(today.getDate() + 1);
      return today;
    }
    const maxDuration = Math.max(...items.map(item => services.find(s => s.id === item.serviceId)?.durationDays || 0));
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + maxDuration);
    return completionDate;
  }, [items, services]);

  return {
    selectedCustomer, setSelectedCustomer,
    items, setItems,
    notes, setNotes,
    discountType, setDiscountType,
    discountValue, setDiscountValue,
    isPayingNow, setIsPayingNow,
    paymentMethod, setPaymentMethod,
    amountPaidStr, setAmountPaidStr,
    tenderedAmountStr, setTenderedAmountStr,
    canApplyDiscount,
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
    amountToPay,
    tenderedAmount,
    changeAmount,
    actualAmountPaid,
    paymentStatus,
    estimatedCompletionDate
  };
}
