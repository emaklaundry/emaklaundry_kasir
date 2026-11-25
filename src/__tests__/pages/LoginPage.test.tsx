import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/pages/LoginPage';

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  addAuditLog: vi.fn(),
}));

vi.mock('@/utils/supabaseClient', () => ({
  supabase: { auth: { signInWithPassword: mocks.signInWithPassword } },
}));

vi.mock('@/contexts/AuditLogContext', () => ({
  useAuditLogs: () => ({ addAuditLog: mocks.addAuditLog }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mocks.signInWithPassword.mockReset();
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
});
