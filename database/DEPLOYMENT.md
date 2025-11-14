Deployment and testing steps for `get_laundry_status` RPC

This file documents safe steps to deploy and test the SQL RPC `get_laundry_status` which is included in `database/database.sql`.

1) Apply the consolidated SQL (recommended)

- Preferred: use Supabase Studio SQL editor.
  - Open Supabase project → SQL Editor.
  - Open `database/database.sql` in your editor (or paste its contents).
  - Run the SQL. This will create tables, policies, helper functions, and the RPC `public.get_laundry_status`.

- Alternative: run via psql (local/CI). Replace placeholders with real values.

```bash
# Example (replace placeholders with actual values from your Supabase project)
psql "postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:5432/postgres" -f database/database.sql
```

2) Verify the function exists

- In Supabase Studio: Database → Functions → search for `get_laundry_status`
- Or in SQL Editor, run:

```sql
SELECT proname, proowner::regrole::text FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE proname = 'get_laundry_status';
```

3) Test the RPC in Supabase SQL Editor

- Replace the example UUID with a transaction id that exists in your DB.

```sql
SELECT * FROM public.get_laundry_status('00000000-0000-0000-0000-000000000000');
```

- Expected: one row (or empty) containing only these columns:
  - id, customerName, createdAt, estimatedCompletionDate, orderStatus, paymentStatus, total, amountPaid

4) Test the RPC from the client (JS)

- Use the helper `getLaundryStatus(transactionId)` you added in `utils/supabaseClient.ts`:

```ts
import { getLaundryStatus } from '../utils/supabaseClient';

async function check() {
  try {
    const data = await getLaundryStatus('00000000-0000-0000-0000-000000000000');
    console.log('rpc result', data);
  } catch (err) {
    console.error('rpc error', err);
  }
}
check();
```

5) Security notes and best practices

- SECURITY DEFINER will run the function with the function owner's privileges. This is convenient but must be handled carefully:
  - Keep the function body minimal and only SELECT the columns you intend to expose.
  - Ensure the function owner is the expected DB role (typically the default owner created by Supabase). Review ownership after deployment.
  - Audit the function source and privileges periodically.

- RLS interplay:
  - Since the function runs as SECURITY DEFINER, it bypasses RLS only for the duration of the function execution.
  - Use this pattern only for small, well-reviewed helper RPCs that expose a safe, limited projection.

- Alternative pattern:
  - If you prefer not to use SECURITY DEFINER, implement a small server-side API (Node/Edge function) that calls Supabase using a server key and returns only safe fields. That requires hosting and protecting the service key.

6) Rollback / Removal

- To remove the function later, you can run:

```sql
DROP FUNCTION IF EXISTS public.get_laundry_status(uuid);

-- If you added the public services RPC, you can drop it with:
DROP FUNCTION IF EXISTS public.get_public_services(uuid);
```

7) Contact and troubleshooting

- If you get permission errors when calling the RPC from the web client, confirm:
  - The function exists and is defined with SECURITY DEFINER.
  - Your client call uses the correct RPC name (`get_laundry_status`) and parameter name (`transaction_id_input`).
  - There are no typos in the call (JS: `supabase.rpc('get_laundry_status', { transaction_id_input })`).


That's it — once you've run the consolidated SQL, the RPC will be available for client calls as documented above.
