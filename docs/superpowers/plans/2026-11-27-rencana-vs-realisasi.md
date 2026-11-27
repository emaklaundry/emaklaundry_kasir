# Rencana vs Realisasi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Angka Simulasi Bisnis disimpan sebagai target per cabang dan dibandingkan dengan angka nyata (nota, pembayaran, pengeluaran) per bulan.

**Architecture:** Tabel `business_targets` + RPC `get_target_vs_actual` (SECURITY INVOKER, pola `get_financial_report`) mengembalikan target mentah + angka nyata. Rumus proyeksi target ada di satu tempat (TypeScript, `computePlan`) dan dipakai oleh tab Rencana, tab Perbandingan, dan kartu Dashboard. Kategori pengeluaran disatukan dalam satu konstanta dengan pemetaan ke baris simulasi, dicerminkan di SQL `target_cost_line()`.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind, @tanstack/react-query, Supabase (Postgres + RLS), Vitest + Testing Library.

**Spec:** [docs/superpowers/specs/2026-11-27-rencana-vs-realisasi-design.md](../specs/2026-11-27-rencana-vs-realisasi-design.md)

## Global Constraints

- **Claude tidak melakukan commit/push.** Setiap "Checkpoint" = jalankan tes, lalu berhenti; pemilik yang commit.
- Ada sesi Claude lain yang berjalan paralel: jangan membatalkan/merapikan perubahan di file yang tidak disentuh task ini.
- Migrasi baru: `supabase/migrations/20261214000000_rencana_vs_realisasi.sql`, aman dijalankan ulang (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS`), dan isinya **juga** ditambahkan di akhir `supabase/setup/0.complete_setup.sql`.
- Menerapkan migrasi ke database produksi **hanya setelah pemilik menyetujui**.
- Fungsi SQL: `SET search_path = ''`, nama tabel ber-skema `public.`, zona waktu default `'Asia/Jakarta'`.
- Teks UI berbahasa Indonesia; mendukung mode gelap (`dark:`) dan layar mobile.
- Angka uang diformat `id-ID` IDR tanpa desimal (pakai `formatCurrency` yang sudah ada di kalkulator, dipindah ke util bersama di Task 3).
- Pendapatan diterima harus identik dengan `get_financial_report.summary.collected`; pengeluaran memakai `public.report_expense_lines()` (jangan menulis ulang logika aset).
- Pengelompokan layanan sama dengan Laporan: `services.category`, fallback unit `kg`→Kiloan, `m2`→Karpet, lainnya→`Lainnya`.
- Tidak ada status nota batal di skema (`OrderStatus`: Diproses/Siap Diambil/Selesai) — semua nota dihitung, sama dengan Laporan.
- Status ✓/⚠ memakai toleransi 5%.

## Review Focus

1. **Bulan tanpa data / bulan depan** (0 nota, 0 pengeluaran, `daysElapsed = 0`): semua angka 0, tidak ada `NaN`/`Infinity` di layar; bulan depan menampilkan "Bulan belum dimulai". → tes di Task 3 & Task 5.
2. **Cabang tanpa target**: Super Admin melihat ajakan "Atur target", Admin melihat "Target belum diatur oleh pemilik", Dashboard tidak menampilkan kartu. → tes di Task 5 & Task 6.
3. **Kategori pengeluaran lama atau teks bebas** (`Perlengkapan`, `Operasional`, `Wi-Fi` dsb.): selalu masuk satu baris, tidak pernah hilang; total biaya + belanja modal = total pengeluaran Laporan. → tes di Task 1 (SQL) & Task 2 (TS).
4. **Batas zona waktu**: nota pukul 23.30 WIB tanggal terakhir bulan masuk bulan itu, bukan bulan berikutnya. → tes SQL di Task 1.
5. **Admin mencoba menyimpan target / melihat cabang lain**: UI menyembunyikan tombol simpan, RLS menolak. → tes SQL di Task 1 & tes komponen di Task 4.

---

### Task 1: Database — tabel target, pemetaan biaya, RPC

**Files:**
- Create: `supabase/migrations/20261214000000_rencana_vs_realisasi.sql`
- Create: `supabase/tests/rencana_vs_realisasi.sql`
- Modify: `supabase/setup/0.complete_setup.sql` (tambahkan isi migrasi di bagian akhir)

**Interfaces:**
- Produces (SQL):
  - Tabel `public.business_targets` dengan kolom: `id uuid pk`, `store_id uuid not null → stores(id) on delete cascade`, `period date null` (hari pertama bulan; NULL = default; `CHECK (period IS NULL OR extract(day from period) = 1)`), `start_date date null`, `investment numeric not null default 0`, `kiloan_kg_per_day`, `kiloan_price`, `satuan_pcs_per_day`, `satuan_price`, `sepatu_pairs_per_day`, `sepatu_price`, `karpet_m2_per_month`, `karpet_price`, `cost_salary`, `cost_rent`, `cost_utilities`, `cost_marketing`, `cost_other`, `hpp_kiloan_pct`, `hpp_satuan_pct`, `hpp_sepatu_pct`, `hpp_karpet_pct` (semua `numeric not null default 0 check (>= 0)`), `notes text`, `updated_at timestamptz default now()`, `updated_by uuid → profiles(id) on delete set null`. `UNIQUE NULLS NOT DISTINCT (store_id, period)`.
  - `public.target_cost_line(p_category text) RETURNS text` IMMUTABLE → salah satu `'hpp'|'salary'|'rent'|'utilities'|'marketing'|'capex'|'other'`:
    - `Bahan Baku`, `Perlengkapan` → `hpp`; `Gaji` → `salary`; `Sewa Tempat` → `rent`; `Listrik`, `Air` → `utilities`; `Marketing & Promosi`, `Pemeliharaan`, `Pemeliharaan Aset` → `marketing`; `Aset / Inventaris`, `Pembelian Aset` → `capex`; selain itu (termasuk NULL) → `other`.
  - `public.upsert_business_target(p_store_id uuid, p_period date, p_data jsonb) RETURNS public.business_targets` — SECURITY INVOKER; `p_data` berkunci sama dengan nama kolom; INSERT … ON CONFLICT (store_id, period) DO UPDATE; mengisi `updated_by = auth.uid()`, `updated_at = now()`.
  - `public.get_target_vs_actual(p_store_id uuid, p_month date, p_as_of date, p_tz text DEFAULT 'Asia/Jakarta') RETURNS jsonb` — SECURITY INVOKER. Periode nyata = `p_month` (dinormalisasi ke hari pertama) s.d. `LEAST(p_as_of, akhir bulan)`; bila `p_as_of < p_month` semua angka nyata 0. `p_store_id NULL` = semua cabang yang terlihat oleh RLS. Bentuk keluaran:

```json
{
  "month": "2026-11-01", "asOf": "2026-11-27",
  "targets": [ { "storeId": "…", "isDefault": true, "row": { /* kolom business_targets */ } } ],
  "actual": {
    "volume":  { "kiloanKg": 0, "satuanPcs": 0, "shoesPairs": 0, "carpetM2": 0 },
    "revenue": { "kiloan": 0, "satuan": 0, "shoes": 0, "carpet": 0, "other": 0, "total": 0 },
    "collected": 0,
    "costs":   { "hpp": 0, "salary": 0, "rent": 0, "utilities": 0, "marketing": 0, "other": 0, "total": 0 },
    "capex": 0
  },
  "daily": [ { "date": "2026-11-01", "gross": 0, "collected": 0 } ],
  "sinceStart": { "startDate": "2026-01-01", "operatingProfit": 0, "capex": 0 }
}
```
  - `targets`: satu entri per cabang yang punya target efektif (baris `period = p_month` bila ada, selain itu baris `period IS NULL`); cabang tanpa target tidak muncul.
  - Volume: Kiloan = qty item kategori Kiloan; Satuan & Sepatu = qty item kategori itu; Karpet m² = qty item kategori Karpet **dengan unit `m2`** saja. Omzet = `subtotal` per kategori (Karpet termasuk item pcs), kategori lain → `other`. Basis tanggal `transactions."createdAt"` di zona `p_tz`.
  - `collected` = jumlah `transaction_payments.amount` dengan `paidAt` di periode.
  - `costs`/`capex` dari `report_expense_lines(p_store_id, start, end, p_tz)` dikelompokkan dengan `target_cost_line(category)`; `costs.total` tidak termasuk `capex`.
  - `daily`: satu baris per hari kalender dari tanggal 1 s.d. `asOf` (termasuk hari tanpa data, nilai 0).
  - `sinceStart`: hanya bila `p_store_id` tidak NULL dan target punya `start_date`; `operatingProfit` = collected − costs.total dari `start_date` s.d. `asOf`; selain itu `null`.
  - RLS `business_targets`: SELECT → Super Admin semua, Admin bila `store_id = get_my_store_id()`; INSERT/UPDATE/DELETE → hanya Super Admin (`(SELECT public.get_my_role()) = 'Super Admin'`). `REVOKE ALL … FROM anon`; `GRANT SELECT, INSERT, UPDATE, DELETE … TO authenticated`; `GRANT EXECUTE` dua RPC ke `authenticated`. Index `(store_id, period)` dari constraint unik sudah cukup.

- [ ] **Step 1: Tulis skrip tes SQL `supabase/tests/rencana_vs_realisasi.sql`**

Skrip berjalan dalam `BEGIN; … ROLLBACK;`, membuat 1 cabang, 3 layanan (Kiloan kg, Karpet m2, Karpet "Keset" pcs), lalu `DO $$ … ASSERT … $$`:
  - `target_cost_line('Perlengkapan') = 'hpp'`, `('Wi-Fi') = 'other'`, `(NULL) = 'other'`, `('Pembelian Aset') = 'capex'`.
  - Nota 5 kg @9000 pada `2026-11-30 23:30+07` dan nota 2 m² + 1 Keset pada `2026-12-01 00:10+07`: `get_target_vs_actual(store, '2026-11-01', '2026-11-30')` → `volume.kiloanKg = 5`, `volume.carpetM2 = 0`, `revenue.total = 45000`; untuk Desember → `carpetM2 = 2`, `revenue.carpet` = subtotal m² + Keset.
  - Pengeluaran `Perlengkapan` 100000, `Wi-Fi` (kategori bebas) 50000, `Aset / Inventaris` 1000000 di November → `costs.hpp = 100000`, `costs.other = 50000`, `capex = 1000000`, dan `costs.total + capex` = `get_financial_report(store,'2026-11-01','2026-11-30')->'summary'->>'expenses'`.
  - `collected` = `summary.collected` dari `get_financial_report` untuk periode yang sama.
  - Target default + target khusus `2026-12-01`: November mengembalikan `isDefault = true`, Desember `isDefault = false`.
  - `p_as_of = '2026-10-15'` untuk bulan November → semua angka nyata 0 dan `daily = []`.
  - Sebagai peran Admin cabang lain (`SET LOCAL request.jwt.claims` + `SET LOCAL ROLE authenticated`, mengikuti cara `get_my_role()` membaca klaim), INSERT ke `business_targets` gagal dan SELECT mengembalikan 0 baris.

- [ ] **Step 2: Jalankan skrip pada database percobaan (lokal `supabase start` atau Supabase branch — minta izin pemilik dulu bila memakai project remote).**

Run: `psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rencana_vs_realisasi.sql`
Expected: FAIL — `function public.target_cost_line(unknown) does not exist`.

- [ ] **Step 3: Tulis migrasi `20261214000000_rencana_vs_realisasi.sql` sesuai Interfaces di atas**, lalu tambahkan isinya di akhir `0.complete_setup.sql` dengan header komentar yang sama seperti migrasi lain.

- [ ] **Step 4: Terapkan migrasi ke database percobaan, jalankan ulang skrip.**

Run: `psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261214000000_rencana_vs_realisasi.sql && psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rencana_vs_realisasi.sql`
Expected: tanpa error, berakhir `ROLLBACK`. Jalankan migrasi dua kali untuk memastikan aman diulang.

- [ ] **Step 5: Checkpoint** — laporkan ke pemilik; pemilik yang commit.

---

### Task 2: Kategori pengeluaran tunggal

**Files:**
- Create: `src/config/expenseCategories.ts`
- Modify: `src/components/ExpenseFormModal.tsx:19`, `src/components/MonthlyExpensesManager.tsx:12`, `src/pages/management/ExpensesPage.tsx:447-452`
- Test: `src/__tests__/config/expenseCategories.test.ts`; perbarui `src/__tests__/components/ExpenseFormModal.test.tsx` bila mengecek daftar opsi lama

**Interfaces:**
- Produces:
  - `export type CostLine = 'hpp' | 'salary' | 'rent' | 'utilities' | 'marketing' | 'capex' | 'other';`
  - `export const EXPENSE_CATEGORIES: readonly string[]` — urutan form: `'Bahan Baku', 'Gaji', 'Sewa Tempat', 'Listrik', 'Air', 'Marketing & Promosi', 'Pemeliharaan', 'Operasional', 'Aset / Inventaris', 'Lainnya'`.
  - `export const LEGACY_EXPENSE_CATEGORIES: readonly string[]` = `['Perlengkapan']` (tidak muncul di form, tetap muncul di filter).
  - `export function costLineFor(category: string | null | undefined): CostLine` — cermin persis `target_cost_line()` di SQL (termasuk `'Pembelian Aset'`, `'Pemeliharaan Aset'`).
  - `export const COST_LINE_LABELS: Record<CostLine, string>` = `{ hpp: 'HPP / Bahan', salary: 'Gaji', rent: 'Sewa', utilities: 'Listrik & Air', marketing: 'Marketing & Pemeliharaan', capex: 'Belanja modal', other: 'Biaya lain' }`.

- [ ] **Step 1: Tulis tes `expenseCategories.test.ts`**: setiap kategori di `EXPENSE_CATEGORIES` dan `LEGACY_EXPENSE_CATEGORIES` dipetakan sesuai tabel spec 6.2; `costLineFor('Wi-Fi') === 'other'`, `costLineFor(undefined) === 'other'`, `costLineFor('Pembelian Aset') === 'capex'`; tidak ada duplikat di `EXPENSE_CATEGORIES`.
- [ ] **Step 2: Jalankan** `npx vitest run src/__tests__/config/expenseCategories.test.ts` → FAIL (modul tidak ada).
- [ ] **Step 3: Buat `src/config/expenseCategories.ts`**, lalu ganti array lokal di form, pengelola bulanan, dan `<option>` filter Pengeluaran dengan konstanta ini (filter = `EXPENSE_CATEGORIES` + `LEGACY_EXPENSE_CATEGORIES`). Bila pengeluaran yang sedang diedit memakai kategori di luar daftar, form tetap menampilkannya sebagai opsi agar tidak tertimpa diam-diam.
- [ ] **Step 4: Jalankan** `npx vitest run src/__tests__/config/expenseCategories.test.ts src/__tests__/components/ExpenseFormModal.test.tsx` → PASS.
- [ ] **Step 5: Checkpoint.**

---

### Task 3: Rumus rencana & perbandingan (pure TS) + klien RPC

**Files:**
- Create: `src/utils/businessPlan.ts`, `src/utils/businessTargets.ts`
- Test: `src/__tests__/utils/businessPlan.test.ts`, `src/__tests__/utils/businessTargets.test.ts`

**Interfaces:**
- Consumes: `CostLine`, `COST_LINE_LABELS` (Task 2); RPC `get_target_vs_actual`, `upsert_business_target` (Task 1).
- Produces (`businessPlan.ts`):
  - `export interface PlanValues { investment: number; startDate: string | null; kiloan: { kgPerDay: number; price: number }; satuan: { pcsPerDay: number; price: number }; shoes: { pairsPerDay: number; price: number }; carpet: { m2PerMonth: number; price: number }; costs: { salary: number; rent: number; utilities: number; marketing: number; other: number }; hpp: { kiloanPercent: number; satuanPercent: number; shoesPercent: number; carpetPercent: number } }`
  - `export const DEFAULT_PLAN_VALUES: PlanValues` — nilai kalkulator lama + `costs.utilities: 1_500_000`, `costs.other: 0`, `startDate: null`.
  - `export interface PlanResult { revenue: { kiloan; satuan; shoes; carpet; total: number }; hpp: { kiloan; satuan; shoes; carpet; total: number }; costs: { hpp; salary; rent; utilities; marketing; other; total: number }; profit: number; margin: number; paybackMonths: number | null }` — `paybackMonths` null bila profit ≤ 0.
  - `export function computePlan(v: PlanValues, daysInMonth = 30): PlanResult` — rumus kalkulator lama dengan `daysInMonth` menggantikan 30; `costs.total` mencakup HPP.
  - `export function sumPlanValues(list: PlanValues[]): PlanValues` — jumlah volume, biaya, investasi; harga & persen HPP = rata-rata tertimbang volume (agar `computePlan(sum)` = jumlah `computePlan` per cabang); `startDate` = null.
  - `export function daysInMonth(monthYmd: string): number` dan `export function daysElapsed(monthYmd: string, todayYmd: string): number` (0 untuk bulan depan, penuh untuk bulan lalu).
  - `export type RowStatus = 'ok' | 'warn' | 'running' | 'none';`
  - `export interface ComparisonRow { key: string; label: string; kind: 'currency' | 'perDay' | 'perMonth' | 'percent' | 'months'; target: number | null; targetToDate: number | null; actual: number | null; diff: number | null; status: RowStatus; higherIsBetter: boolean; note?: string }`
  - `export function buildComparison(plan: PlanValues, actual: ActualMonth, opts: { monthYmd: string; todayYmd: string }): ComparisonRow[]` — baris berurutan: `kiloanPerDay`, `satuanPerDay`, `shoesPerDay`, `carpetM2`, `revenueGross` (Omzet nilai nota), `collected` (Pendapatan diterima), `hpp`, `salary`, `rent`, `utilities`, `marketing`, `other`, `operatingProfit` (Laba operasional), `margin`, `capex` (info, status `none`, note "Laba bersih di Laporan = laba operasional − belanja modal"), `payback`.
    - Per-hari: target = nilai/hari rencana, actual = volume ÷ `daysElapsed`. Bulanan & uang: `targetToDate = target × daysElapsed / daysInMonth` hanya untuk `carpetM2`, `revenueGross`, `collected`, `hpp`; status dibanding `targetToDate` (bulan berjalan) atau `target` (bulan selesai).
    - Biaya tetap & `operatingProfit`, `margin`, `payback`: status `'running'` selama bulan berjalan; setelah selesai dibanding `target`.
    - Toleransi: higher-is-better → `ok` bila `actual ≥ 0.95 × pembanding`; lower-is-better → `ok` bila `actual ≤ 1.05 × pembanding`; target 0 → `none`.
    - `daysElapsed === 0` → semua `actual = null`, status `none`.
    - `payback` actual = `investment ÷ operatingProfit` (null bila ≤ 0).
- Produces (`businessTargets.ts`):
  - `export interface ActualMonth { volume: { kiloanKg; satuanPcs; shoesPairs; carpetM2: number }; revenue: { kiloan; satuan; shoes; carpet; other; total: number }; collected: number; costs: Record<Exclude<CostLine, 'capex'>, number> & { total: number }; capex: number }`
  - `export interface StoreTarget { storeId: string; isDefault: boolean; values: PlanValues }`
  - `export interface TargetVsActual { month: string; asOf: string; targets: StoreTarget[]; actual: ActualMonth; daily: { date: string; gross: number; collected: number }[]; sinceStart: { startDate: string; operatingProfit: number; capex: number } | null }`
  - `export function rowToPlanValues(row: Record<string, unknown>): PlanValues` dan `export function planValuesToRow(v: PlanValues): Record<string, number | string | null>` (pemetaan kolom Task 1 ↔ `PlanValues`; angka string → number seperti `normalizeReport`).
  - `export function normalizeTargetVsActual(raw: unknown): TargetVsActual`
  - `export async function fetchTargetVsActual(p: { storeId: string | null; monthYmd: string; asOfYmd: string }): Promise<TargetVsActual>` — `p_tz` dari `Intl` seperti `fetchFinancialReport`. Bila error berkode `PGRST202`/`42883`/`42P01` lempar `Error('MIGRATION_MISSING')` (tanpa fallback browser — spec opsi 3 ditolak).
  - `export async function fetchStoreTargets(storeId: string): Promise<{ period: string | null; values: PlanValues; updatedAt: string }[]>` (baca langsung tabel `business_targets`).
  - `export async function saveStoreTarget(storeId: string, periodYmd: string | null, v: PlanValues): Promise<void>` → RPC `upsert_business_target`.

- [ ] **Step 1: Tulis `businessPlan.test.ts`:**
  - `computePlan(DEFAULT_PLAN_VALUES, 30)` dengan `utilities = 0` menghasilkan angka yang sama dengan kalkulator lama (omzet 29.500.000 = 21,6 jt + 3 jt + 4,5 jt + 0,4 jt; hitung ulang dari `DEFAULT_VALUES` lama untuk HPP & profit).
  - `computePlan` dengan semua 0 → `margin = 0`, `paybackMonths = null`, tanpa NaN.
  - `daysInMonth('2026-02-01') === 28`; `daysElapsed('2026-11-01','2026-11-15') === 15`; `daysElapsed('2026-12-01','2026-11-27') === 0`; `daysElapsed('2026-10-01','2026-11-27') === 31`.
  - `sumPlanValues([a, b])` lalu `computePlan` → `revenue.total` dan `profit` sama dengan jumlah per cabang.
  - `buildComparison` di tengah bulan (15 dari 30 hari, target omzet 30 jt, nota 14,5 jt) → `revenueGross.targetToDate = 15_000_000`, status `ok` (≥ 95%); `salary.status === 'running'`.
  - `buildComparison` bulan selesai, gaji nyata 6,4 jt vs target 6 jt → `warn`; HPP 5,2 jt vs 5,9 jt → `ok`.
  - `buildComparison` bulan depan → semua `actual === null`, tidak ada `NaN` di objek mana pun.
  - Baris `capex` selalu status `none` dan membawa note rekonsiliasi.
- [ ] **Step 2: Tulis `businessTargets.test.ts`** (mock `@/utils/supabaseClient` seperti `financialReport.test.ts`): `normalizeTargetVsActual` mengubah angka string ke number dan mengisi default 0 untuk kunci hilang; `rowToPlanValues(planValuesToRow(v))` deep-equal `v`; `fetchTargetVsActual` memanggil RPC `get_target_vs_actual` dengan `p_store_id`, `p_month`, `p_as_of`; error `PGRST202` → reject `MIGRATION_MISSING`; `saveStoreTarget` memanggil `upsert_business_target` dengan `p_period: null` untuk default.
- [ ] **Step 3: Jalankan** `npx vitest run src/__tests__/utils/businessPlan.test.ts src/__tests__/utils/businessTargets.test.ts` → FAIL.
- [ ] **Step 4: Implementasikan kedua file.** Pindahkan `formatCurrency` dari kalkulator ke `businessPlan.ts` (ekspor) bila belum ada util serupa di `src/utils/formatting.ts`; bila ada, pakai yang itu.
- [ ] **Step 5: Jalankan ulang** → PASS.
- [ ] **Step 6: Checkpoint.**

---

### Task 4: Tab Rencana (kalkulator + simpan target) & izin

**Files:**
- Create: `src/pages/business/PlanTab.tsx` (isi kalkulator lama, dipindah dari `BusinessCalculatorPage.tsx`)
- Modify: `src/pages/business/BusinessCalculatorPage.tsx` (jadi wadah sub-tab), `src/config/permissions.ts`, `src/__tests__/config/permissions.test.ts`
- Test: `src/__tests__/pages/business/PlanTab.test.tsx`

**Interfaces:**
- Consumes: `PlanValues`, `DEFAULT_PLAN_VALUES`, `computePlan`, `formatCurrency` (Task 3); `fetchStoreTargets`, `saveStoreTarget` (Task 3); `useAppContext()` (`currentUser`, `selectedStoreId`, `stores`); `useToasts()`.
- Produces:
  - Permission baru `'business.targets.manage'` hanya di daftar Super Admin (`[...ADMIN, 'system.manage', 'business.targets.manage']`), dengan komentar JSDoc "Menyimpan target Simulasi Bisnis per cabang."
  - `BusinessCalculatorPage` membaca `?view=rencana|perbandingan` (default `rencana`) dan merender `<PlanTab />` atau `<ComparisonTab />` (Task 5) dengan tablist yang sama gayanya dengan `BusinessHubPage`; parameter `tab=kalkulator` tetap dipertahankan saat berpindah view.
  - `PlanTab` tanpa props.

Perilaku `PlanTab`:
- Kalkulator tetap bisa dipakai tanpa menyimpan (semua peran yang punya `business.hub`).
- Input baru: **Listrik & Air**, **Biaya lain**, dan **Tanggal mulai operasi** (opsional, `<input type="date">`) di kartu Investasi.
- Ringkasan memakai `computePlan(values, daysInMonth(bulan terpilih atau bulan ini))`; label "EBITDA (Laba Bersih)" diganti "Laba operasional".
- Bila `can(role, 'business.targets.manage')`: panel "Target cabang" berisi pemilih cabang (default `selectedStoreId` bila bukan `'all'`), pemilih periode (`Default (setiap bulan)` + 12 bulan ke depan dan 12 bulan ke belakang berlabel `November 2026`), tombol **Muat target tersimpan** dan **Simpan sebagai target**, serta teks "Ada perubahan yang belum disimpan" bila nilai berbeda dari yang tersimpan. Setelah simpan: toast sukses, invalidasi query `['business-targets', storeId]` dan `['target-vs-actual']`, serta audit log memakai `addAuditLog` seperti halaman lain.
- Bila tidak punya izin: panel tidak dirender.

- [ ] **Step 1: Perbarui `permissions.test.ts`**: `can(SuperAdmin,'business.targets.manage') === true`, `can(Admin, …) === false`, `can(Cashier, …) === false`.
- [ ] **Step 2: Tulis `PlanTab.test.tsx`** (mock `useAppContext`, `businessTargets`): (a) Admin → tidak ada tombol "Simpan sebagai target"; (b) Super Admin → klik simpan memanggil `saveStoreTarget(storeId, null, values)` untuk periode Default; (c) mengubah "Target Kg / Hari" memunculkan "Ada perubahan yang belum disimpan" setelah target dimuat; (d) mengisi semua input 0 tidak menampilkan "NaN" atau "Infinity".
- [ ] **Step 3: Jalankan** `npx vitest run src/__tests__/config/permissions.test.ts src/__tests__/pages/business/PlanTab.test.tsx` → FAIL.
- [ ] **Step 4: Implementasikan** izin, `PlanTab`, dan wadah sub-tab.
- [ ] **Step 5: Jalankan ulang** → PASS, lalu `npm run type-check`.
- [ ] **Step 6: Checkpoint.**

---

### Task 5: Tab Perbandingan

**Files:**
- Create: `src/pages/business/ComparisonTab.tsx`, `src/pages/business/CumulativeChart.tsx`
- Test: `src/__tests__/pages/business/ComparisonTab.test.tsx`

**Interfaces:**
- Consumes: `fetchTargetVsActual`, `TargetVsActual` (Task 3); `sumPlanValues`, `buildComparison`, `computePlan`, `daysInMonth`, `daysElapsed`, `formatCurrency` (Task 3); `useToday()`; `useAppContext()`; `can()`.
- Produces: `ComparisonTab` (tanpa props); `CumulativeChart: React.FC<{ daily: TargetVsActual['daily']; monthlyTarget: number; daysInMonth: number }>`.

Perilaku:
- Pemilih bulan `<input type="month">` (default bulan ini). Cabang: Super Admin memakai `selectedStoreId` global (`'all'` → `storeId: null`, label "Semua cabang"); Admin selalu `currentUser.storeId` (pola `effectiveStoreId` di `ReportsPage.tsx:388-393`).
- Query key `['target-vs-actual', storeIdOrAll, monthYmd, todayYmd]`; `asOfYmd = todayYmd`.
- Target: `targets.length === 0` → keadaan kosong (Super Admin: tombol "Atur target" ke `?tab=kalkulator&view=rencana`; Admin: "Target belum diatur oleh pemilik."). Semua cabang → `sumPlanValues(targets.map(t => t.values))`, dengan catatan "Cabang tanpa target: N" bila jumlah target lebih sedikit dari cabang yang terlihat (cabang tanpa target tetap terhitung di angka nyata — tulis catatan ini).
- Tabel kolom: **Baris | Target | Target s.d. hari ini** (hanya bulan berjalan) **| Nyata | Selisih | Status**. Ikon status: ✓ hijau (`ok`), ⚠ amber (`warn`), "berjalan" abu-abu (`running`), kosong (`none`). Setiap ikon punya `aria-label`. Gunakan kelas tabel yang sama dengan ReportsPage.
- Di atas tabel: label periode ("November 2026 · hari ke-27 dari 30" atau "Bulan selesai" atau "Bulan belum dimulai"), dan teks basis: "Omzet = nilai nota yang dibuat; Pendapatan = uang yang diterima; Biaya = pengeluaran tercatat."
- Kartu "Sejak mulai operasi" bila `sinceStart` ada: akumulasi laba operasional vs investasi target (progres %), dan belanja modal nyata vs investasi target.
- `CumulativeChart`: SVG garis kumulatif `collected` per hari vs garis lurus target (`monthlyTarget × hari / daysInMonth`); tiru gaya SVG `TrendChart` di `ReportsPage.tsx:233`; sertakan `<title>` dan tabel data tersembunyi untuk pembaca layar.
- Error `MIGRATION_MISSING` → pesan "Fitur ini butuh pembaruan database. Hubungi pengelola sistem."

- [ ] **Step 1: Tulis `ComparisonTab.test.tsx`** (mock `fetchTargetVsActual`, `useAppContext`, `useToday` = `2026-11-15`): (a) dengan target & data → baris "Laba operasional" tampil, kolom "Target s.d. hari ini" ada, baris Gaji berstatus "berjalan"; (b) `targets: []` sebagai Admin → teks "Target belum diatur oleh pemilik."; sebagai Super Admin → tautan "Atur target"; (c) bulan `2026-12` → "Bulan belum dimulai" dan tidak ada "NaN"; (d) baris "Belanja modal" menampilkan catatan rekonsiliasi; (e) `MIGRATION_MISSING` → pesan pembaruan database.
- [ ] **Step 2: Jalankan** `npx vitest run src/__tests__/pages/business/ComparisonTab.test.tsx` → FAIL.
- [ ] **Step 3: Implementasikan** `ComparisonTab` dan `CumulativeChart`, sambungkan ke wadah sub-tab dari Task 4.
- [ ] **Step 4: Jalankan ulang** → PASS; `npm run type-check`.
- [ ] **Step 5: Checkpoint.**

---

### Task 6: Kartu "Target bulan ini" di Dashboard + Bantuan

**Files:**
- Create: `src/components/dashboard/TargetMonthCard.tsx` (buat folder bila belum ada; ikuti lokasi kartu Dashboard lain bila sudah ada pola berbeda)
- Modify: `src/pages/Dashboard.tsx` (render kartu di area keuangan yang dijaga `canViewFinance`), `src/config/helpTopics.ts:312` (topik kalkulator), `README.md` (daftar fitur)
- Test: `src/__tests__/components/TargetMonthCard.test.tsx`

**Interfaces:**
- Consumes: `fetchTargetVsActual`, `buildComparison`, `sumPlanValues` (Task 3); query key `['target-vs-actual', …]` yang sama dengan Task 5 agar cache dipakai bersama.
- Produces: `TargetMonthCard: React.FC<{ storeId: string | null }>`.

Perilaku: tampil hanya bila `can(role,'finance.view') && can(role,'business.hub')` dan `targets.length > 0`; menampilkan baris `collected` dan `operatingProfit` (nyata vs target s.d. hari ini / target bulan) dengan ikon status, plus tautan "Lihat perbandingan" ke `/business?tab=kalkulator&view=perbandingan`. Saat loading/error: tidak merender apa pun (Dashboard tidak boleh rusak karena fitur ini).

- [ ] **Step 1: Tulis tes**: tanpa target → `container` kosong; dengan target → tautan "Lihat perbandingan" ber-`href` di atas; error RPC → `container` kosong.
- [ ] **Step 2: Jalankan** `npx vitest run src/__tests__/components/TargetMonthCard.test.tsx` → FAIL.
- [ ] **Step 3: Implementasikan** kartu, pasang di Dashboard, perbarui topik Bantuan (jelaskan: simpan target, arti Omzet vs Pendapatan, belanja modal, status "berjalan") dan README.
- [ ] **Step 4: Verifikasi penuh**: `npm run test:all` dan `npm run type-check` → semua lulus. Bila `format:check` gagal di file yang disentuh, jalankan `npx prettier --write <file-file itu>` saja (jangan seluruh repo — ada sesi paralel).
- [ ] **Step 5: Checkpoint akhir** — ringkas perubahan untuk pemilik; ingatkan bahwa migrasi Task 1 belum diterapkan ke produksi sampai pemilik setuju.
