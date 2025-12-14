# 🚀 DEPLOYMENT GUIDE - Laundry Management System

## 📋 Pre-Deployment Checklist

### ✅ **CRITICAL - HARUS DILAKUKAN**

- [ ] **Rotate Supabase Credentials**
  - Anon key sudah terekspos, HARUS diganti
  - URL: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
  - Steps:
    1. Login ke Supabase Dashboard
    2. Project Settings → API
    3. Click "Reset" pada anon key
    4. Copy new key
    5. Update `.env` file lokal
    6. Deploy `.env` ke production server

- [ ] **Deploy Database Enhancements**
  - File: `database/setup/3.security_and_performance.sql`
  - Run di Supabase SQL Editor
  - Verify indexes created: `SELECT * FROM pg_indexes WHERE tablename IN ('transactions', 'customers', 'audit_logs');`
  - Run `VACUUM ANALYZE;` setelah create index

- [ ] **Environment Variables**
  - Copy `.env.example` ke production
  - Update semua values
  - Pastikan `.env` TIDAK di commit ke git
  - Verify `.gitignore` includes `.env`

---

## 🔧 Production Build

### 1. **Build Application**

```bash
# Install dependencies
npm install

# Run TypeScript check
npx tsc --noEmit

# Run tests
npm test

# Build for production
npm run build
```

**Expected Output:**
- `dist/` folder created
- ~450KB bundle size (gzipped)
- 0 TypeScript errors
- All tests passed

### 2. **Preview Production Build**

```bash
npm run preview
```

Akses http://localhost:4173 untuk test production build lokal.

---

## 🗄️ Database Setup

### 1. **Deploy Database Schema**

Jalankan scripts dalam urutan:

```sql
-- 1. Create tables and basic structure
\i database/setup/1.database.sql

-- 2. Apply RPC functions and seed data
\i database/setup/2.apply_rpc_and_seed.sql

-- 3. Security and performance enhancements
\i database/setup/3.security_and_performance.sql
```

### 2. **Verify Setup**

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public';

-- Verify functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### 3. **Performance Optimization**

```sql
-- Analyze query planner statistics
VACUUM ANALYZE;

-- Check index usage
SELECT 
  schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

---

## 🔐 Security Configuration

### 1. **Supabase Settings**

**URL:** https://supabase.com/dashboard/project/YOUR_PROJECT/settings

#### **Authentication**
- ✅ Email confirmation required
- ✅ Password minimum length: 6 characters
- ✅ JWT expiry: 3600 seconds (1 hour)
- ✅ Disable signup (manual user creation only)

#### **API Settings**
- ✅ Enable RLS on all tables
- ✅ Service role key: KEEP SECRET (server-side only)
- ✅ Anon key: Rotate after exposure

#### **Database**
- ✅ Connection pooling: Enabled
- ✅ Statement timeout: 30s
- ✅ Max connections: 50

### 2. **Row Level Security Policies**

Verify semua policies aktif:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Expected policies:
- `transactions`: view, insert, update (3 policies)
- `customers`: view, insert, update (3 policies)
- `inventory`: view, insert, update (3 policies)
- `assets`: view, insert, update (3 policies)
- `expenses`: view, insert, update (3 policies)
- `audit_logs`: view, insert (2 policies)

### 3. **Environment Variables Security**

**Production `.env` file:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0

# Optional
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=your_sentry_dsn
```

**NEVER commit:**
- `.env`
- `.env.local`
- `.env.production`
- Any file containing API keys

---

## 🌐 Deployment Options

### Option 1: **Vercel (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Configuration (`vercel.json`):**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**Environment Variables di Vercel:**
1. Dashboard → Project Settings → Environment Variables
2. Add: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
3. Scope: Production

### Option 2: **Netlify**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

**Configuration (`netlify.toml`):**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: **Custom Server (VPS)**

```bash
# Install nginx
sudo apt install nginx

# Build application
npm run build

# Copy dist to nginx
sudo cp -r dist/* /var/www/html/

# Configure nginx
sudo nano /etc/nginx/sites-available/default
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## 📊 Performance Monitoring

### 1. **Setup Monitoring Tools**

#### **Sentry (Error Tracking)**

```bash
npm install @sentry/react @sentry/vite-plugin
```

**`src/main.tsx`:**

```tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production",
    tracesSampleRate: 1.0,
  });
}
```

#### **Google Analytics**

```bash
npm install react-ga4
```

### 2. **Performance Metrics**

Monitor via browser DevTools:
- **FCP (First Contentful Paint):** < 1.8s
- **LCP (Largest Contentful Paint):** < 2.5s
- **TTI (Time to Interactive):** < 3.8s
- **CLS (Cumulative Layout Shift):** < 0.1

### 3. **Supabase Monitoring**

Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT

Monitor:
- **Database queries:** Slow queries (>1s)
- **API requests:** Error rate
- **Storage:** Usage limits
- **Auth:** Failed login attempts

---

## 🧪 Testing

### Pre-Production Tests

```bash
# Unit tests
npm test

# Type checking
npx tsc --noEmit

# Build verification
npm run build
npm run preview

# E2E tests (if configured)
npm run test:e2e
```

### Manual Testing Checklist

**Core Features:**
- [ ] Login/Logout
- [ ] Create transaction
- [ ] Update transaction status
- [ ] Accept payment
- [ ] Print receipt
- [ ] Send WhatsApp
- [ ] Manage inventory
- [ ] Manage customers
- [ ] View reports

**Role-Based Access:**
- [ ] SuperAdmin: All features
- [ ] Admin: Store management
- [ ] Cashier: Transactions only

**Mobile Responsiveness:**
- [ ] Test pada smartphone (< 768px)
- [ ] Touch targets ≥ 48x48px
- [ ] Bottom navigation works
- [ ] Modals responsive

**PWA:**
- [ ] Install prompt works
- [ ] Offline mode functional
- [ ] Service worker caching

---

## 📝 Post-Deployment

### 1. **Health Checks**

```bash
# Check application
curl https://yourdomain.com

# Check API
curl https://yourdomain.com/api/health

# SSL certificate
openssl s_client -connect yourdomain.com:443
```

### 2. **Setup Backups**

**Supabase Backups:**
- Daily automatic backups (Pro plan)
- Manual backup: Database → Backups → Create backup

**Custom Backup Script:**

```sql
-- Export data
pg_dump -h db.YOUR_PROJECT.supabase.co \
  -U postgres \
  -d postgres \
  -f backup_$(date +%Y%m%d).sql
```

### 3. **Monitoring Schedule**

**Daily:**
- Check error logs
- Monitor transaction volume
- Database performance

**Weekly:**
- Review slow queries
- Clean old audit logs (>90 days)
- Update dependencies

**Monthly:**
- Security audit
- Performance review
- User feedback review
- Backup verification

---

## 🆘 Troubleshooting

### Common Issues

**1. Build fails with TypeScript errors**

```bash
# Clear cache
rm -rf node_modules dist .vite
npm install
npm run build
```

**2. Supabase connection error**

- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Check Supabase project status
- Verify RLS policies tidak terlalu restrictive

**3. 404 on page refresh**

- Configure server redirects (see deployment options)
- Vercel/Netlify: Use rewrites configuration
- Nginx: `try_files $uri /index.html`

**4. Slow queries**

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add missing indexes
CREATE INDEX idx_missing ON table_name(column_name);
```

---

## 📞 Support & Resources

### Documentation
- **React:** https://react.dev
- **Vite:** https://vitejs.dev
- **Supabase:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

### Developer
- **Email:** support@novionics.web.id
- **Website:** https://novionics.web.id
- **GitHub:** (Repository link)

---

## ✅ Final Checklist

Before going live:

- [ ] Rotate Supabase credentials
- [ ] Deploy database enhancements
- [ ] Configure environment variables
- [ ] Run all tests
- [ ] Build successful
- [ ] Manual testing complete
- [ ] Setup monitoring (Sentry, Analytics)
- [ ] Configure backups
- [ ] SSL certificate active
- [ ] DNS configured
- [ ] Error tracking active
- [ ] Performance baseline recorded

---

**🎉 Ready for Production!**

Developed by **Novionics** | https://novionics.web.id
© 2025 Laundry Management System
