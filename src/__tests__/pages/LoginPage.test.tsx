import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/pages/LoginPage';

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  setSession: vi.fn(),
  invoke: vi.fn(),
  addAuditLog: vi.fn(),
}));

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      setSession: mocks.setSession,
    },
    functions: { invoke: mocks.invoke },
  },
}));

vi.mock('@/contexts/AuditLogContext', () => ({
  useAuditLogs: () => ({ addAuditLog: mocks.addAuditLog }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mocks.signInWithPassword.mockReset();
    mocks.setSession.mockReset();
    mocks.invoke.mockReset();
    mocks.invoke.mockResolvedValue({ data: { profiles: [] }, error: null });
    mocks.setSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.addAuditLog.mockReset();
    document.title = '';
  });

  it('sets the login page title and exposes a main heading', () => {
    render(<LoginPage />);

    expect(document.title).toBe('Masuk | Laundry POS');
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Masuk ke Akun Anda' }),
    ).toBeInTheDocument();
  });

  it('announces failed login attempts to assistive technology', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Email atau password salah' },
    });

    const { container } = render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Masuk sebagai admin' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });
    const form = container.querySelector('form');
    if (!form) throw new Error('Login form was not rendered');
    fireEvent.submit(form);

    expect(await screen.findByRole('alert')).toHaveTextContent('Email atau password salah');
  });

  it('signs staff in with the selected profile and six-digit PIN', async () => {
    mocks.invoke
      .mockResolvedValueOnce({
        data: {
          profiles: [
            {
              id: 'employee-1',
              name: 'Sari Laundry',
              storeName: 'Cabang Utama',
            },
          ],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        },
        error: null,
      });

    render(<LoginPage />);
    fireEvent.click(await screen.findByRole('radio', { name: /Sari Laundry/ }));
    fireEvent.change(screen.getByLabelText('PIN (6 digit)'), {
      target: { value: '001234' },
    });
    fireEvent.submit(screen.getByRole('form', { name: 'Login karyawan' }));

    await waitFor(() => {
      expect(mocks.invoke).toHaveBeenLastCalledWith('employee-login', {
        body: { action: 'login', employeeId: 'employee-1', pin: '001234' },
      });
    });
    await waitFor(() => {
      expect(mocks.setSession).toHaveBeenCalledWith({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
    });
  });
});
