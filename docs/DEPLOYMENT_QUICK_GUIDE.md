# 🚀 DEPLOYMENT CHECKLIST - Quick Reference

## ✅ PRE-DEPLOYMENT (5 Minutes)

### 1. Environment Setup

```bash
# Copy template
cp .env.example .env

# Edit dengan credentials Anda
# VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
# VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

**Get credentials:**

- Login: https://supabase.com
- Project → Settings → API
- Copy URL & anon key

### 2. Database Setup

```sql
-- Di Supabase SQL Editor:
-- 1. Copy SEMUA isi file: database/setup/complete_setup.sql
-- 2. Paste di SQL Editor
-- 3. Klik Run
-- ✅ Done! (1 file saja, ~1 menit)
```

### 3. Final Verification

```bash
# Test build
npm run build

# Should see:
# ✓ built in XXXms
# ✓ PWA v1.2.0
```

---

## 🌐 DEPLOYMENT OPTIONS

### Option A: Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Import di Vercel
# - vercel.com/new
# - Import repository
# - Add env vars:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY

# 3. Deploy
# ✅ Auto deploy!
```

### Option B: Netlify

```bash
# 1. Push to GitHub
git push origin main

# 2. Import di Netlify
# - app.netlify.com/start
# - Import from Git
# - Add env vars
# - Build: npm run build
# - Publish: dist

# 3. Deploy
# ✅ Done!
```

---

## ✅ POST-DEPLOYMENT (10 Minutes)

### 1. Verify Core Functions

- [ ] Login works
- [ ] Create transaction
- [ ] Add customer
- [ ] View reports
- [ ] Mobile responsive
- [ ] PWA installable

### 2. Test Privacy Settings

```bash
# Check robots.txt
curl https://your-domain.com/robots.txt
# Should see: Disallow: /

# Google search (after 1 day)
site:your-domain.com
# Should: 0 results
```

### 3. Monitor Performance

```bash
# Lighthouse test
# Chrome DevTools → Lighthouse → Run

# Target:
# Performance: >90
# Accessibility: >90
# Best Practices: >90
# SEO: N/A (private)
```

---

## 🔧 TROUBLESHOOTING

### Issue: Login doesn't work

```bash
# Check:
1. VITE_SUPABASE_URL correct?
2. VITE_SUPABASE_ANON_KEY correct?
3. Database setup run?
4. RLS policies active?

# Test:
# Supabase Dashboard → Authentication
# Should see users table
```

### Issue: Build fails

```bash
# Fix:
npm run build

# If errors:
npm install
npm run build
```

### Issue: 404 on refresh

```bash
# Vercel: Already configured (vercel.json)
# Netlify: Add _redirects file:
echo "/*    /index.html   200" > dist/_redirects
```

---

## 📊 MONITORING SETUP (Optional)

### Error Tracking - Sentry

```bash
npm install @sentry/react

# Add to src/index.tsx:
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

### Analytics - Plausible (Privacy-friendly)

```html
<!-- Add to index.html: -->
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

---

## 🎯 LAUNCH DAY CHECKLIST

**Morning:**

- [ ] Final backup database
- [ ] Review error logs
- [ ] Test all features
- [ ] Prepare rollback plan

**During Launch:**

- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Test live site
- [ ] Monitor errors
- [ ] Check performance

**After Launch:**

- [ ] Announce to team
- [ ] Monitor for 1 hour
- [ ] Check user feedback
- [ ] Document issues
- [ ] Plan hotfixes if needed

---

## 📞 EMERGENCY CONTACTS

```
Database Issue:   Check Supabase Dashboard
Build Failure:    Check Vercel/Netlify logs
Bug Reports:      GitHub Issues
Questions:        mhmdnvn18@gmail.com
```

---

## 🎉 SUCCESS CRITERIA

**Week 1:**

- [ ] 0 critical bugs
- [ ] Uptime >99%
- [ ] All features working
- [ ] Users can login/use
- [ ] Performance good

**Week 2-4:**

- [ ] User feedback collected
- [ ] Minor bugs fixed
- [ ] Performance optimized
- [ ] Features requested noted

---

**Remember:**

- 🔒 Website is PRIVATE (noindex)
- 📱 PWA can be installed
- 🔐 Login required untuk access
- 💾 Database backup auto-running
- 📊 Monitoring recommended

**Good luck!** 🚀
