import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { AppProvider } from './AppContext';
import { ToastProvider } from './ToastContext';
import useAppContext from './useAppContext';

// Mock dependencies
vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('./StoreContext', () => ({ useStores: () => ({ stores: [] }) }));


const TestComponent = () => {
  const ctx = useAppContext();
  return (
    <div>
      <span data-testid="user">{ctx.currentUser ? ctx.currentUser.name : 'none'}</span>
      <button onClick={() => ctx.setSelectedStoreId('test')}>setStore</button>
      <span data-testid="store">{ctx.selectedStoreId}</span>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default values and allows store selection', () => {
    render(
      <ToastProvider>
        <AppProvider>
          <TestComponent />
        </AppProvider>
      </ToastProvider>,
    );
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(screen.getByTestId('store').textContent).toBe('all');
    act(() => {
      screen.getByText('setStore').click();
    });
    expect(screen.getByTestId('store').textContent).toBe('test');
  });

  it('throws error if used outside provider', () => {
    // Must call inside a component or hook, so use a wrapper
    function Wrapper() {
      useAppContext();
      return null;
    }
    expect(() => render(<Wrapper />)).toThrow();
  });
});
