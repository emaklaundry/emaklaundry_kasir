# 🔒 Security Checklist

## ✅ Security Best Practices Implemented

### 1. **Environment Variables**

- ✅ `.env` files di-gitignore
- ✅ `.env.example` tersedia untuk dokumentasi
- ✅ Semua sensitive data menggunakan environment variables
- ✅ Client-side variables menggunakan `VITE_` prefix

### 2. **Supabase Security**

- ✅ Row Level Security (RLS) aktif di semua tabel schema `public` (dicek 26 Nov 2026)
- ✅ Anon key digunakan di client (public-safe; data dijaga RLS)
- ✅ Service key TIDAK di-commit ke repository dan hanya dipakai di Edge Functions
- ✅ Database policies berdasarkan user role & store
- ✅ Data karyawan, absensi, kasbon, dan gaji hanya untuk Admin cabang & Super Admin
- ✅ Fungsi admin/maintenance (`SECURITY DEFINER`) tidak bisa dipanggil tanpa login
- ✅ Edge Functions hanya menerima origin di secret `ALLOWED_ORIGIN`

### 3. **Authentication**

- ✅ Login menggunakan Supabase Auth
- ✅ Password tidak disimpan di client
- ✅ Session management otomatis via Supabase
- ✅ Role-based access control (SuperAdmin, Admin, Kasir), di menu (`src/config/navigation.ts`), rute
  (`AdminRoute` di `src/App.tsx`), dan database (RLS)
- ✅ Login karyawan dengan PIN 6 angka lewat Edge Function `employee-login`
- ✅ PIN Supervisor: disimpan sebagai hash bcrypt, 5 kali salah dikunci 15 menit, setiap persetujuan
  tercatat di Log Audit

### 4. **Code Security**

- ✅ No hardcoded secrets
- ✅ TypeScript strict mode enabled
- ✅ ESLint configured dengan security rules
- ✅ `npm audit --omit=dev`: 0 vulnerabilities (26 Nov 2026)

### 5. **API Security**

- ✅ Supabase RLS policies untuk data access control
- ✅ Input validation di forms
- ✅ SQL injection protection (Supabase prepared statements)
- ✅ HTTPS only (enforced di production)

### 6. **Data Privacy**

- ✅ Multi-tenant isolation (per store/branch)
- ✅ User data encrypted at rest (Supabase)
- ✅ Sensitive data tidak di-log
- ✅ Audit log untuk tracking perubahan penting

---

## ⚠️ Security Warnings

### DO NOT:

- ❌ Commit `.env` files ke Git
- ❌ Share `SUPABASE_SERVICE_KEY` (service role key)
- ❌ Hardcode API keys atau passwords
- ❌ Disable RLS di production
- ❌ Expose admin endpoints tanpa auth
- ❌ Log sensitive user data

### DO:

- ✅ Gunakan `.env.example` untuk dokumentasi
- ✅ Rotate Supabase keys jika ter-leak
- ✅ Review RLS policies secara berkala
- ✅ Update dependencies: `npm audit fix`
- ✅ Test security sebelum deploy
- ✅ Enable 2FA di Supabase account

---

## 🔐 Production Deployment Checklist

**Before deploying:**

1. **Environment Variables**
   - [ ] Set `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di Vercel
   - [ ] Verify `.env` tidak ter-commit
   - [ ] Secret `ALLOWED_ORIGIN` Edge Functions berisi domain production

2. **Database Security**
   - [ ] Review semua RLS policies
   - [ ] Test RLS dengan different user roles
   - [ ] Backup database sebelum deploy
   - [ ] SQL rilis dijalankan sesuai urutan di [DEPLOYMENT.md](../deployment/DEPLOYMENT.md)

3. **Application Security**
   - [ ] Run `npm audit` - fix vulnerabilities
   - [ ] Test authentication flow
   - [ ] Verify role-based access control
   - [ ] Test form validation

4. **Monitoring**
   - [ ] Setup error tracking (Sentry/LogRocket)
   - [ ] Monitor Supabase logs
   - [ ] Setup uptime monitoring
   - [ ] Enable database backup automation

---

## 📚 Security Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security-best-practices)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

---

**Pemeriksaan terakhir:** 26 November 2026 (RLS, policy anon, npm audit)  
**Next Review:** Setiap 3 bulan atau saat ada major update
