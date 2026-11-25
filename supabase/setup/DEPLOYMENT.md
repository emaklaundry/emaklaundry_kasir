# Database Deployment Guide

This guide explains how to deploy the database schema using `complete_setup.sql`.

---

## 📋 Prerequisites

- Active Supabase project
- Project credentials (URL and API keys)
- SQL Editor access OR psql CLI tool

---

## 🚀 Method 1: Using Supabase Studio (RECOMMENDED)

### Step 1: Access SQL Editor

1. Login to https://supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run Setup Script

1. Open `supabase/setup/complete_setup.sql` in your local editor
2. Copy the entire file contents (Ctrl+A, Ctrl+C)
3. Paste into the Supabase SQL Editor
4. Click **RUN** button (or press Ctrl+Enter)
5. Wait ~30-60 seconds for completion

### Step 3: Verify Deployment

Run this query in SQL Editor:

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: 13 tables

-- Check functions created
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
-- Expected: 5+ functions
```

### Step 4: (Optional) Add Sample Data

If you want sample data for testing:

1. Open `supabase/setup/seed_data.sql`
2. Copy and paste into SQL Editor
3. Run to add sample stores, users, and services

---

## 🖥️ Method 2: Using psql (Command Line)

### Prerequisites

- psql installed on your system
- Database connection string from Supabase

### Deployment Command

```bash
# Get connection string from: Supabase Dashboard → Settings → Database
# Format: postgresql://<USER>:<PASSWORD>@<HOST>:5432/postgres

psql "postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:5432/postgres" \
  -f supabase/setup/complete_setup.sql
```

### Add Sample Data (Optional)

```bash
psql "postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:5432/postgres" \
  -f supabase/setup/seed_data.sql
```

---

## 🔒 Security Notes

### RPC Functions with SECURITY DEFINER

The `get_laundry_status` and other RPC functions use `SECURITY DEFINER` to bypass RLS:

- ✅ **Safe**: Functions only expose specific, safe columns
- ⚠️ **Caution**: Review function code before deployment
- 🔍 **Best Practice**: Audit function privileges periodically

### Alternative Approach

Instead of SECURITY DEFINER, you can:

1. Use server-side API with service role key
2. Implement custom middleware for authentication
3. Use Supabase Edge Functions

---

## 🧪 Testing RPC Functions

### Test in SQL Editor

```sql
-- Replace UUID with actual transaction ID
SELECT * FROM public.get_laundry_status('00000000-0000-0000-0000-000000000000');

-- Expected columns:
-- id, customerName, createdAt, estimatedCompletionDate,
-- orderStatus, paymentStatus, total, amountPaid
```

### Test from Client (JavaScript)

```typescript
import { supabase } from './supabaseClient';

async function testRPC() {
  const { data, error } = await supabase.rpc('get_laundry_status', {
    transaction_id_input: 'your-transaction-uuid-here',
  });

  if (error) console.error('Error:', error);
  else console.log('Result:', data);
}
```

---

## 🔄 Rollback / Removal

To remove functions later:

```sql
-- Remove specific RPC function
DROP FUNCTION IF EXISTS public.get_laundry_status(uuid);

-- Remove all custom functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_transaction_status_safe(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.complete_scheduled_maintenance(uuid) CASCADE;
```

---

## ❓ Troubleshooting

### Error: "relation already exists"

**Solution:** Tables already exist. Either:

1. Drop tables manually in SQL Editor
2. Use fresh database
3. Uncomment DROP statements in `complete_setup.sql`

### Error: "permission denied"

**Solution:** Ensure you're using a user with CREATE privileges (default Supabase user should work)

### Error: "function does not exist"

**Solution:** Re-run `complete_setup.sql` - ensure all sections execute successfully

### Functions not visible from client

**Checklist:**

- ✅ Function defined with `SECURITY DEFINER`
- ✅ Correct RPC name in client call
- ✅ Correct parameter names (e.g., `transaction_id_input`)
- ✅ No typos in client code

---

## 📚 What Gets Deployed

`complete_setup.sql` includes:

- ✅ 13 database tables
- ✅ Custom ENUM types (order_status, payment_method, etc.)
- ✅ Helper functions (handle_new_user, etc.)
- ✅ RPC functions for client access
- ✅ Row Level Security (RLS) policies
- ✅ Performance indexes
- ✅ Triggers for auto-updates
- ✅ Maintenance mode settings

---

## 📞 Support

For deployment issues or questions:

- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed walkthrough
- Review [README.md](./README.md) for file structure
- Contact: mhmdnvn18@gmail.com

---

**Last Updated:** December 17, 2024  
**Database Version:** 2.1.0
