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
    localStorage.clear();
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
    fireEvent.click(screen.getByRole('button', { name: 'Masuk sebagai Super Admin' }));
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
    // Auto-submit on the 6th digit must not log in a second time on form submit.
    expect(mocks.invoke).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('emaklaundry:lastEmployeeProfileId')).toBe('employee-1');
  });

  it('submits automatically once the sixth PIN digit is entered', async () => {
    mocks.invoke
      .mockResolvedValueOnce({ data: { profiles: [profile('employee-1', 'Sari')] }, error: null })
      .mockResolvedValueOnce({
        data: { session: { access_token: 'a', refresh_token: 'r' } },
        error: null,
      });

    render(<LoginPage />);
    fireEvent.click(await screen.findByRole('radio', { name: /Sari/ }));
    const pinInput = screen.getByLabelText('PIN (6 digit)');
    expect(pinInput).toHaveFocus();
    fireEvent.change(pinInput, { target: { value: '123456' } });

    await waitFor(() => {
      expect(mocks.invoke).toHaveBeenLastCalledWith('employee-login', {
        body: { action: 'login', employeeId: 'employee-1', pin: '123456' },
      });
    });
  });

  it('preselects the profile that last logged in on this device', async () => {
    localStorage.setItem('emaklaundry:lastEmployeeProfileId', 'employee-2');
    mocks.invoke.mockResolvedValueOnce({
      data: { profiles: [profile('employee-1', 'Sari'), profile('employee-2', 'Budi')] },
      error: null,
    });

    render(<LoginPage />);
    expect(await screen.findByRole('radio', { name: /Budi/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Sari/ })).not.toBeChecked();
  });

  it('lets staff retry when profiles fail to load', async () => {
    mocks.invoke
      .mockResolvedValueOnce({ data: null, error: new Error('offline') })
      .mockResolvedValueOnce({ data: { profiles: [profile('employee-1', 'Sari')] }, error: null });

    render(<LoginPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByRole('radio', { name: /Sari/ })).toBeInTheDocument();
  });

  it('shows a search box and filters when there are many profiles', async () => {
    const names = ['Sari', 'Budi', 'Ani', 'Dewi', 'Eko', 'Fajar', 'Gita'];
    mocks.invoke.mockResolvedValueOnce({
      data: { profiles: names.map((name, i) => profile(`employee-${i}`, name)) },
      error: null,
    });

    render(<LoginPage />);
    const searchBox = await screen.findByRole('searchbox', { name: 'Cari profil karyawan' });
    fireEvent.change(searchBox, { target: { value: 'dew' } });

    expect(screen.getAllByRole('radio')).toHaveLength(1);
    expect(screen.getByRole('radio', { name: /Dewi/ })).toBeInTheDocument();
  });

  it('translates Supabase credential errors to Indonesian', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', code: 'invalid_credentials', status: 400 },
    });

    const { container } = render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Masuk sebagai Super Admin' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } });
    const form = container.querySelector('form');
    if (!form) throw new Error('Login form was not rendered');
    fireEvent.submit(form);

    expect(await screen.findByRole('alert')).toHaveTextContent('Email atau password salah.');
  });
});

function profile(id: string, name: string) {
  return { id, name, storeName: null };
}
