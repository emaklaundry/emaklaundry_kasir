Tentu, ini adalah Prompt Set (Kumpulan Perintah) yang dirancang khusus untuk AI Agent / Gravity IDE agar bisa mengeksekusi setup Monorepo (Web + Mobile + Desktop) di project emaklaundry_kasir Anda secara otomatis.

Silakan copy-paste prompt ini secara berurutan ke dalam chat IDE Anda.

🟢 Prompt 1: Setup Mobile (Capacitor)
Tujuan: Menginstal engine mobile dan menyiapkan folder Android.

🔵 Prompt 2: Setup Desktop (Tauri)
Tujuan: Menginstal engine desktop (Rust wrapper) dan mengkonfigurasi agar bisa membaca hasil build React.

🟡 Prompt 3: Unifikasi Script (Convenience)
Tujuan: Mempermudah Anda menjalankan aplikasi. Cukup ketik npm run mobile atau npm run desktop tanpa perlu hafal perintah panjang.

🔴 Prompt 4: Pembersihan (.gitignore)
Tujuan: Agar file sampah hasil build (seperti folder dist atau src-tauri/target) tidak ikut ter-upload ke GitHub dan memberatkan repo.

🚀 Cara Menggunakan Hasilnya
Setelah AI selesai menjalankan semua perintah di atas:

Untuk Web (Tetap sama): npm run dev → Buka Browser.

Untuk Desktop: npm run desktop → Akan muncul jendela aplikasi Windows native.

Untuk Mobile: npm run mobile → Akan membuka Android Studio. Dari sana, Anda tinggal klik tombol "Play" (Run) untuk install ke HP yang colok USB atau ke Emulator.
