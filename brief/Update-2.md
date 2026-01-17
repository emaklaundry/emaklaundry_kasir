Phase 1: Analisis & Persiapan (Plan Mode)
Gunakan mode "Plan" (bukan Chat biasa) untuk membiarkan AI membaca seluruh repo emaklaundry_kasir Anda.

Prompt 1 (Architecture Analysis):

Plaintext

@Codebase Analyze my current project structure, specifically focusing on 'src/hooks' and 'src/utils/supabaseClient.ts'.
I want to migrate this React app to a "Local-First" architecture using Tauri and SQLite, but keeping Supabase for sync.

Please generate a detailed migration plan that covers:

1. Creating a standardized 'DataManager' interface that abstracts database calls.
2. Listing all React Hooks that currently directly access Supabase.
3. Proposing a strategy to sync data between local SQLite and Supabase.
   Do not write code yet, just give me the architectural blueprint.
   Phase 2: Infrastruktur Desktop (Infrastructure Agent)
   Setelah rencana disetujui, suruh Agen untuk melakukan instalasi. Antigravity bisa menjalankan terminal sendiri.

Prompt 2 (Setup Tauri & SQLite):

Plaintext

@Terminal Execute the setup for Tauri v2 in this project.

1. Initialize Tauri with 'npm run tauri init'.
2. Install the plugin '@tauri-apps/plugin-sql' for SQLite support.
3. Create a migration file 'src-tauri/migrations/initial.sql' and generate SQL CREATE TABLE statements that mirror my current Supabase schema (Customer, Transaction, Inventory, etc).
4. Configure 'tauri.conf.json' to allow the SQL plugin.
   Catatan: Pastikan Anda memberikan skema database Supabase Anda (file database/setup/0.complete_setup.sql) sebagai referensi konteks.

Phase 3: Refactoring Data Layer (The Heavy Lifting)
Ini adalah bagian di mana Antigravity bersinar. Tugas ini biasanya memakan waktu berhari-hari, tapi Agen bisa melakukannya dalam hitungan menit.

Prompt 3 (Create Data Abstraction):

Plaintext

I need to abstract the data layer.

1. Create a new file 'src/services/dbFactory.ts'.
2. Implement a Repository Pattern. Create a generic interface 'IRepository<T>' with methods: getAll, getById, create, update, delete.
3. Create two implementations:
   - 'SupabaseRepository': Uses my existing supabaseClient.
   - 'SQLiteRepository': Uses Tauri SQL plugin.
4. Create a 'ServiceLocator' that decides which repository to use based on connection status (Online/Offline).
   Prompt 4 (Refactor Hooks - Mass Edit): Gunakan fitur "Multi-file Edit" atau "Agent Run" untuk ini.

Plaintext

@Codebase Refactor all custom hooks in 'src/hooks/' (e.g., useTransactions, useCustomers).
Replace direct 'supabase.from(...)' calls with the new 'dbFactory' or 'Repository' pattern we just created.
Ensure that the hooks now fetch data from the local SQLite database by default.
Keep the original Supabase logic commented out or moved to a 'sync' function for later use.
Phase 4: Sync Engine (Logic Agent)
Ini bagian tersulit. Gunakan Agen untuk menulis logika sinkronisasi.

Prompt 5 (Sync Logic):

Plaintext

Create a background synchronization service in 'src/services/SyncEngine.ts'.
The logic should be:

1. 'Pull': On app start, fetch data from Supabase where 'updated_at' > last_sync_time and update SQLite.
2. 'Push': Create a 'mutation_queue' table in SQLite. When a user saves a transaction offline, save it to SQLite and add a record to 'mutation_queue'.
3. Process the queue: When online, iterate through the queue and send requests to Supabase.
4. Handle conflicts: If server 'updated_at' > local 'updated_at', server wins.
   Tips Keamanan Menggunakan Antigravity IDE:
   Gunakan "Review Mode": Karena migrasi database sangat krusial, jangan biarkan Agen auto-commit. Aktifkan mode di mana Anda harus menekan "Approve" untuk setiap perubahan file.

Isolasi Konteks: Saat melakukan Prompt 4 (Refactor Hooks), matikan akses Agen ke folder database/ agar dia tidak tidak sengaja mengubah skema asli SQL Anda.

Human in the Loop: Antigravity sangat cepat, tapi logika bisnis "Smart Discount Balance" Anda (kembalian < 500 jadi saldo) adalah logika unik. Pastikan Agen tidak menghapus logika bisnis unik ini saat melakukan abstraksi database. Tambahkan di prompt: "Preserve all specific business logic inside the hooks, only change the data fetching method."
