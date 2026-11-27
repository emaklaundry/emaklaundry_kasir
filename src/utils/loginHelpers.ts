const LAST_PROFILE_KEY = 'emaklaundry:lastEmployeeProfileId';

/** Two-letter initials ("Siti Aminah" → "SA"), one letter for single-word names. */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

/** Translate Supabase auth errors to Indonesian; unknown messages pass through. */
export function translateAuthError(error: {
  message: string;
  code?: string;
  status?: number;
}): string {
  const code = error.code ?? '';
  const message = error.message.toLowerCase();
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'Email atau password salah.';
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Periksa kotak masuk email Anda.';
  }
  if (
    code === 'over_request_rate_limit' ||
    error.status === 429 ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return 'Terlalu banyak percobaan login. Tunggu beberapa saat lalu coba lagi.';
  }
  if (code === 'user_banned' || message.includes('banned')) {
    return 'Akun ini sedang dinonaktifkan. Hubungi pemilik usaha.';
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Login gagal. Periksa koneksi internet dan coba lagi.';
  }
  return error.message;
}

export function readLastProfileId(): string | null {
  try {
    return localStorage.getItem(LAST_PROFILE_KEY);
  } catch {
    return null;
  }
}

export function saveLastProfileId(id: string): void {
  try {
    localStorage.setItem(LAST_PROFILE_KEY, id);
  } catch {
    // Storage unavailable (private mode); remembering the profile is optional.
  }
}
