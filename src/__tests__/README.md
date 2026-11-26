# 🧪 Testing Guide - Laundry Management System

## 📁 Struktur Test Files

Folder tes mengikuti struktur `src/`. Tes untuk `src/components/Foo.tsx` ada di
`src/__tests__/components/Foo.test.tsx`, dan seterusnya.

```
src/__tests__/
├── components/    # Komponen UI & modal (termasuk layout/Sidebar, Header)
├── contexts/      # State global (AppContext, TransactionContext, ...)
├── hooks/         # Hook kustom
├── pages/         # Halaman (termasuk HelpPage, EmployeesPage, pages/transactions/)
├── utils/         # Logika murni (employee, supervisorApproval, excel, ...)
├── types/         # Pemeriksaan tipe
└── integration/   # Alur lintas modul: audit-tracking, critical-flows
```

Satu tes lama masih berada di `src/utils/__tests__/`. Lihat daftar lengkap dengan
`npx vitest list`.

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

Per 26 November 2026: **86 file, 252 tes lulus, 2 dilewati** (`npm test`).

| Folder      | File                              |
| ----------- | --------------------------------- |
| components  | 36                                |
| pages       | 16                                |
| contexts    | 13                                |
| utils       | 11 (+1 di `src/utils/__tests__/`) |
| hooks       | 5                                 |
| types       | 2                                 |
| integration | 2                                 |

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

**Diperbarui:** 26 November 2026
