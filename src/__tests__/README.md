# 🧪 Testing Guide - Laundry Management System

## 📁 Struktur Test Files

Semua file test telah dirapihkan dan dipindahkan ke folder `src/__tests__/`:

```
src/__tests__/
├── components/          # 34 files - Component tests
│   ├── AssetFormModal.test.tsx
│   ├── BottomNavBar.test.tsx
│   ├── CommandPalette.test.tsx
│   ├── ConfirmationModal.test.tsx
│   ├── CustomerFormModal.test.tsx
│   ├── CustomerSelector.test.tsx
│   ├── EmptyState.test.tsx
│   ├── ExpenseFormModal.test.tsx
│   ├── Header.test.tsx
│   ├── icons.test.tsx
│   ├── InventoryFormModal.test.tsx
│   ├── ItemNotesModal.test.tsx
│   ├── KiloanTaggingModal.test.tsx
│   ├── Layout.test.tsx
│   ├── MaintenanceFormModal.test.tsx
│   ├── MaintenanceHistoryModal.test.tsx
│   ├── MaintenanceMode.test.tsx
│   ├── Modal.test.tsx
│   ├── Pagination.test.tsx
│   ├── PaymentModal.test.tsx
│   ├── QuickMaintenanceModal.test.tsx
│   ├── QuickStockUpdateModal.test.tsx
│   ├── ScheduledMaintenanceFormModal.test.tsx
│   ├── ScheduledMaintenanceModal.test.tsx
│   ├── ServiceFormModal.test.tsx
│   ├── ServiceSelector.test.tsx
│   ├── Sidebar.test.tsx
│   ├── SortableHeader.test.tsx
│   ├── StoreFormModal.test.tsx
│   ├── SuccessModal.test.tsx
│   ├── ToastContainer.test.tsx
│   ├── UserFormModal.test.tsx
│   ├── VersionInfo.test.tsx
│   └── WhatsAppModal.test.tsx
│
├── contexts/            # 13 files - Context/State management tests
│   ├── AppContext.test.tsx
│   ├── AssetContext.test.tsx
│   ├── AuditLogContext.test.tsx
│   ├── CustomerContext.test.tsx
│   ├── ExpenseContext.test.tsx
│   ├── InventoryContext.test.tsx
│   ├── ScheduledMaintenanceContext.test.tsx
│   ├── ServiceContext.test.tsx
│   ├── SettingsContext.test.tsx
│   ├── StoreContext.test.tsx
│   ├── ToastContext.test.tsx
│   ├── TransactionContext.test.tsx
│   └── UserContext.test.tsx
│
├── hooks/               # 5 files - Custom hooks tests
│   ├── useDebounce.test.ts
│   ├── usePagination.test.ts
│   ├── useSortableData.test.ts
│   ├── useStoreFilteredData.test.ts
│   └── useTheme.test.ts
│
├── pages/               # 14 files - Page component tests
│   ├── management/      # 5 files
│   │   ├── AssetsPage.test.tsx
│   │   ├── CustomerDetailPage.test.tsx
│   │   ├── CustomersPage.test.tsx
│   │   ├── ExpensesPage.test.tsx
│   │   └── InventoryPage.test.tsx
│   │
│   ├── transactions/    # 4 files
│   │   ├── NewTransactionPage.test.tsx
│   │   ├── ReceiptPage.test.tsx
│   │   ├── TransactionDetailPage.test.tsx
│   │   └── TransactionPage.test.tsx
│   │
│   └── Root pages:      # 5 files
│       ├── AuditLogPage.test.tsx
│       ├── Dashboard.test.tsx
│       ├── LoginPage.test.tsx
│       ├── QuickActionsPage.test.tsx
│       └── ReportsPage.test.tsx
│
├── utils/               # 7 files - Utility function tests
│   ├── dateHelpers.test.ts
│   ├── formatting.test.ts
│   ├── index.test.ts
│   ├── rateLimiter.test.ts
│   ├── supabaseClient.real.test.ts
│   ├── supabaseClient.test.ts
│   └── uiHelpers.test.ts
│
├── types/               # 3 files - Type definition tests
│   ├── index.test.ts
│   ├── shims-react-router-dom.test.ts
│   └── shims.test.ts
│
└── integration/         # 2 files - Integration/E2E tests
    ├── audit-tracking.test.tsx
    └── critical-flows.test.tsx

Total: 78 test files
```

---

## 🚀 Running Tests

### Run All Tests

```bash
npm run test
```

### Run Specific Category

```bash
# Components only
npm test -- __tests__/components

# Contexts only
npm test -- __tests__/contexts

# Hooks only
npm test -- __tests__/hooks

# Pages only
npm test -- __tests__/pages

# Utils only
npm test -- __tests__/utils

# Integration tests only
npm test -- __tests__/integration
```

### Run Single File

```bash
npm test -- MaintenanceMode.test.tsx
```

### Watch Mode

```bash
npm test -- --watch
```

### Coverage Report

```bash
npm test -- --coverage
```

---

## 📊 Test Statistics

| Category        | Files  | Description              |
| --------------- | ------ | ------------------------ |
| **Components**  | 34     | UI component unit tests  |
| **Contexts**    | 13     | State management tests   |
| **Pages**       | 14     | Page component tests     |
| **Utils**       | 7      | Utility function tests   |
| **Hooks**       | 5      | Custom React hooks tests |
| **Types**       | 3      | TypeScript type tests    |
| **Integration** | 2      | End-to-end flow tests    |
| **Total**       | **78** | All test files           |

---

## 🎯 Test Coverage Goals

| Category   | Current | Target |
| ---------- | ------- | ------ |
| Statements | TBD     | >80%   |
| Branches   | TBD     | >75%   |
| Functions  | TBD     | >80%   |
| Lines      | TBD     | >80%   |

---

## ✅ Testing Best Practices

### 1. **File Naming**

- Component test: `ComponentName.test.tsx`
- Hook test: `useHookName.test.ts`
- Utility test: `utilityName.test.ts`

### 2. **Test Structure**

```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    // Act
    // Assert
  });

  it('should handle user interaction', () => {
    // Test user events
  });
});
```

### 3. **Test Organization**

- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 4. **Mocking**

- Mock external dependencies
- Use `vi.fn()` for function mocks
- Use `vi.mock()` for module mocks

---

## 🔧 Test Configuration

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### vitest.setup.ts

```typescript
import '@testing-library/jest-dom';
```

---

## 📚 Testing Libraries

- **Vitest** - Test runner (v4.0.15)
- **@testing-library/react** - React component testing
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom matchers

---

## 🐛 Common Issues & Solutions

### Issue: Tests fail after moving files

**Solution:** Import paths masih merujuk ke lokasi lama. File test tetap di lokasi lama tidak perlu update path karena file source tidak berubah.

### Issue: Cannot find module '@/...'

**Solution:** Check `vitest.config.ts` dan pastikan alias `@` sudah terkonfigurasi.

### Issue: Test timeout

**Solution:** Tambahkan timeout di test config atau individual test:

```typescript
it('should load data', async () => {
  // test code
}, 10000); // 10 second timeout
```

---

## 📝 Writing New Tests

### Component Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  it('should render with default props', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Hook Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHookName } from '@/hooks/useHookName';

describe('useHookName', () => {
  it('should return initial value', () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current).toBeDefined();
  });
});
```

---

## 🎯 Test Checklist

Before committing:

- [ ] All tests pass (`npm test`)
- [ ] No console errors/warnings
- [ ] Code coverage maintained/improved
- [ ] New features have tests
- [ ] Bug fixes have regression tests

---

## 📖 Related Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Project README](../../README.md)

---

**Last Updated:** December 14, 2025  
**Version:** 2.0.0
