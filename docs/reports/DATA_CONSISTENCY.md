# 🔒 DATA CONSISTENCY & RELIABILITY GUIDE

## 📋 Overview

Aplikasi ini menggunakan **Conservative/Pessimistic Approach** untuk memastikan **konsistensi data yang ketat** dan **zero data loss**. Tidak ada optimistic update - semua perubahan menunggu konfirmasi dari server sebelum UI diupdate.

---

## 🎯 Prinsip Utama

### ✅ **Consistency Over Speed**

- **UI hanya update setelah server confirm**
- **Tidak ada optimistic update**
- **Semua operasi diverifikasi**
- **Retry otomatis untuk network failure**

### ✅ **Zero Data Loss**

- **Automatic retry dengan exponential backoff**
- **Verification setelah setiap save**
- **Idempotency key untuk prevent duplicates**
- **Transaction rollback pada error**

### ✅ **User Feedback**

- **Clear loading states**
- **Progress notifications**
- **Detailed error messages**
- **Success confirmation**

---

## 🔧 Implementation

### 1. **Retry Mechanism**

**File:** `src/utils/retryUtils.ts`

```typescript
// Retry dengan exponential backoff
await retrySupabaseOperation(async () => {
  const { data, error } = await supabase...
  if (error) throw error;
  return data;
}, 'Insert Transaction');
```

**Features:**

- Max 3 retries
- Exponential backoff (1s, 2s, 4s)
- Automatic network error detection
- Logging untuk debugging

---

### 2. **Data Verification**

**Verify setelah save:**

```typescript
await verifyDataSaved(
  async () => {
    // Fetch data dari server
    const { data } = await supabase.from('transactions').select('*').eq('id', savedId).single();
    return data;
  },
  (data) => {
    // Validate data benar-benar tersimpan
    return data !== null && data.id === savedId;
  },
  { maxAttempts: 3, pollInterval: 300 },
);
```

**Benefits:**

- Memastikan data benar-benar di database
- Detect silent failures
- Catch replication lag issues

---

### 3. **Transaction Context**

**File:** `src/contexts/TransactionContext.tsx`

#### **Add Transaction (Create)**

```typescript
const addTransaction = useMutation({
  mutationFn: async (transaction) => {
    // 1. Retry operation
    const saved = await retrySupabaseOperation(async () => {
      const { data, error } = await supabase.from('transactions').insert([transaction]).select();
      if (error) throw error;
      return data[0];
    }, 'Insert Transaction');

    // 2. Verify saved
    const verified = await verifyDataSaved(
      async () => {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', saved.id)
          .single();
        return data;
      },
      (data) => data !== null && data.id === saved.id,
      { maxAttempts: 3, pollInterval: 300 },
    );

    return verified;
  },
  onSuccess: () => {
    // Force refresh dari server
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
});
```

**Flow:**

1. ⏳ User click "Simpan"
2. 🔄 Retry insert (max 3x)
3. ✅ Verify data tersimpan
4. 🔄 Force refresh dari server
5. ✓ Success notification

---

#### **Update Transaction**

```typescript
const updateTransaction = useMutation({
  mutationFn: async ({ id, data }) => {
    // Update dengan retry
    const result = await retrySupabaseOperation(async () => {
      const { data: updated, error } = await supabase
        .from('transactions')
        .update(data)
        .eq('id', id)
        .select();
      if (error) throw error;
      return updated[0];
    }, 'Update Transaction');

    return result;
  },
  onSuccess: async (result, variables) => {
    // Verify update berhasil
    await verifyDataSaved(
      async () => {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', variables.id)
          .single();
        return data;
      },
      (data) => {
        if (!data) return false;
        // Verify semua field yang diupdate
        return Object.keys(variables.data).every((key) => {
          return data[key] === variables.data[key];
        });
      },
    );

    // Force refresh
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
  onError: () => {
    // Force refresh untuk sync UI dengan DB
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
});
```

**Flow:**

1. ⏳ User update status/payment
2. 🔄 Retry update (max 3x)
3. ✅ Verify fields updated
4. 🔄 Force refresh
5. ✓ Success notification

---

### 4. **Loading States**

**File:** `src/pages/transactions/NewTransactionPage.tsx`

```typescript
const [isSaving, setIsSaving] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();

  // Prevent double submission
  if (isSaving) {
    addToast('Transaksi sedang disimpan, mohon tunggu...', 'warning');
    return;
  }

  setIsSaving(true);
  const toastId = addToast('Menyimpan transaksi ke database...', 'info');

  try {
    const saved = await addTransaction(newTransaction);

    updateToast(toastId, 'Memverifikasi data tersimpan...', 'info');

    if (saved) {
      updateToast(toastId, '✓ Transaksi berhasil disimpan dan terverifikasi.', 'success');
    } else {
      throw new Error('Tidak ada data yang dikembalikan dari server');
    }
  } catch (error) {
    updateToast(toastId, `Gagal menyimpan: ${error.message}`, 'error');
  } finally {
    setIsSaving(false);
  }
};
```

**UI States:**

- `isSaving === true`: Button disabled, spinner shown
- Toast shows progress: "Menyimpan..." → "Memverifikasi..." → "✓ Berhasil"
- Error: Clear message dengan alasan kegagalan

---

### 5. **Idempotency Protection**

**Prevent duplicate transactions:**

```typescript
const [idempotencyKey] = useState(generateUUID());

const newTransaction = {
  ...transactionData,
  idempotencyKey: idempotencyKey,
};

// Database constraint: UNIQUE(idempotencyKey)
```

**Benefits:**

- Prevent double-submit
- Safe retry on network error
- Detect duplicate submissions

**Handling Duplicate:**

```sql
-- Database setup
ALTER TABLE transactions
ADD CONSTRAINT unique_idempotency_key
UNIQUE (idempotencyKey);
```

```typescript
// Application handling
try {
  await addTransaction(newTransaction);
} catch (error) {
  if (error.code === '23505' && error.message.includes('idempotencyKey')) {
    // Fetch existing transaction
    const existing = await fetchByIdempotencyKey(idempotencyKey);
    // Use existing transaction instead
    setTransaction(existing);
  }
}
```

---

## 🚨 Error Handling

### Network Errors

**Auto-retry:**

```typescript
// Network error → retry 3x dengan backoff
try {
  await retrySupabaseOperation(fn, 'Operation Name');
} catch (error) {
  // Setelah 3x retry gagal
  throw new Error(`Operasi gagal setelah 3 percobaan. ` + `Periksa koneksi internet Anda.`);
}
```

### Validation Errors

**Immediate feedback:**

```typescript
if (!selectedCustomer) {
  addToast('Pelanggan harus dipilih.', 'warning');
  return;
}

if (items.length === 0) {
  addToast('Minimal satu layanan harus ditambahkan.', 'warning');
  return;
}
```

### Server Errors

**Detailed message:**

```typescript
catch (error) {
  const message = error instanceof Error
    ? error.message
    : 'Unknown error';

  addToast(`Gagal menyimpan transaksi: ${message}`, 'error');

  // Log untuk debugging
  console.error('Transaction save failed:', error);
}
```

---

## 📊 User Experience

### Loading Indicators

**1. Button State:**

```tsx
<button disabled={isSaving} className={isSaving ? 'opacity-50 cursor-not-allowed' : ''}>
  {isSaving ? (
    <>
      <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
      Menyimpan...
    </>
  ) : (
    'Simpan Transaksi'
  )}
</button>
```

**2. Toast Progress:**

```typescript
const toastId = addToast('Menyimpan...', 'info');
// ... operation ...
updateToast(toastId, 'Memverifikasi...', 'info');
// ... verification ...
updateToast(toastId, '✓ Berhasil', 'success');
```

**3. Full Page Loader** (optional):

```tsx
{
  isSaving && (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <SpinnerIcon className="w-12 h-12 animate-spin" />
        <p>Menyimpan data...</p>
      </div>
    </div>
  );
}
```

---

## ✅ Benefits

### 1. **Data Integrity**

- ✓ Zero data loss
- ✓ No phantom writes
- ✓ Consistent state

### 2. **Reliability**

- ✓ Auto-retry network failures
- ✓ Verification after save
- ✓ Rollback on error

### 3. **User Trust**

- ✓ Clear feedback
- ✓ Progress visibility
- ✓ Error transparency

### 4. **Debugging**

- ✓ Detailed logging
- ✓ Error tracing
- ✓ Audit trail

---

## ⚠️ Trade-offs

### Conservative Approach

**Pros:**

- ✅ 100% data consistency
- ✅ No ghost data
- ✅ Clear user feedback
- ✅ Easy to debug

**Cons:**

- ⏱️ Slightly slower UX (wait for server)
- 🔄 More network calls (verification)
- 💾 Higher bandwidth usage

### Why We Chose This

**Laundry POS Context:**

- **Financial transactions** - Zero tolerance untuk data loss
- **Multi-user** - Consistency critical
- **Audit trail** - Must be accurate
- **Print receipts** - Data must be verified before print

**User Expectation:**

> "Saya lebih suka tunggu 2-3 detik dan yakin data tersimpan, `+`daripada cepat tapi ada risiko data hilang."

---

## 🔍 Monitoring

### Metrics to Track

1. **Success Rate:**
   - Total saves: X
   - Successful: Y
   - Failed: Z
   - Success rate: Y/X \* 100%

2. **Retry Statistics:**
   - Average retries per operation
   - Success after retry %

3. **Verification:**
   - Verification failures
   - Verification latency

4. **Performance:**
   - Average save time
   - 95th percentile
   - Max save time

### Logging

```typescript
// Development
console.log('[Retry 1/3] Insert Transaction failed:', error);
console.log('[Verify] Data saved successfully');

// Production (Sentry/Analytics)
Sentry.captureMessage('Transaction save retry', {
  level: 'warning',
  extra: { attempt: 1, error: error.message },
});
```

---

## 📝 Best Practices

### 1. **Always Use Retry Utilities**

```typescript
// ❌ BAD
const { data, error } = await supabase.from('table').insert(data);

// ✅ GOOD
const data = await retrySupabaseOperation(async () => {
  const { data, error } = await supabase.from('table').insert(data).select();
  if (error) throw error;
  return data[0];
}, 'Insert Data');
```

### 2. **Verify Critical Operations**

```typescript
// Critical: Transactions, Payments, Inventory changes
await verifyDataSaved(fetchFn, validateFn);

// Non-critical: UI preferences, logs
// No verification needed
```

### 3. **Show Progress**

```typescript
// Update toast untuk visibility
const toast = addToast('Saving...', 'info');
// ... operation ...
updateToast(toast, 'Verifying...', 'info');
// ... verification ...
updateToast(toast, 'Success!', 'success');
```

### 4. **Handle All Errors**

```typescript
try {
  await operation();
} catch (error) {
  if (error instanceof NetworkError) {
    // Retry atau inform user
  } else if (error instanceof ValidationError) {
    // Show validation message
  } else {
    // Generic error handling
  }
}
```

---

## 🎓 Summary

**Conservative Approach = High Reliability**

- ✅ No optimistic updates
- ✅ Wait for server confirmation
- ✅ Verify data saved
- ✅ Auto-retry failures
- ✅ Clear user feedback
- ✅ Zero data loss tolerance

**Perfect for:**

- Financial applications
- POS systems
- Inventory management
- Medical records
- Any system where data accuracy > speed

---

**Developed by Novionics** | https://novionics.web.id
© 2025 Laundry Management System
