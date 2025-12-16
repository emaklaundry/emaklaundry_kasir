# Fix: Masalah Cache & Login yang Memerlukan Hard Refresh

## 🐛 Masalah

User harus melakukan **Ctrl+Shift+R** (hard refresh) untuk bisa login atau melihat perubahan kode terbaru. Ini disebabkan oleh:

1. **Service Worker menggunakan cache-first strategy untuk JavaScript dan CSS**
   - Kode lama tetap di-cache dan digunakan meskipun ada update baru
   - User tidak mendapat kode terbaru sampai hard refresh

2. **Cache name tidak berubah saat ada update**
   - `CACHE_NAME = 'laundry-management-v1-runtime'` tetap sama
   - Tidak ada invalidasi cache otomatis

3. **Service Worker di development mode**
   - Menyebabkan masalah saat development karena kode selalu berubah

4. **Auto-update tanpa notifikasi**
   - User tidak tahu ada update baru
   - Tidak ada kontrol untuk reload saat siap

---

## ✅ Solusi yang Diimplementasikan

### 1. Update Service Worker Strategy

**File: `src/sw.js`**

#### Perubahan:
- ✅ Cache name sekarang **version-based**: `laundry-management-v2.1.0-runtime`
- ✅ **JS dan CSS**: Diubah dari `cache-first` → `network-first` dengan `cache: 'no-cache'`
  - Selalu coba ambil dari network dulu
  - Cache hanya sebagai fallback saat offline
  - **Mencegah kode lama di-cache**
  
- ✅ **Images dan Fonts**: Tetap `cache-first` (tidak berubah sering)
- ✅ **Supabase API**: Tetap `network-only` (data real-time)

```javascript
// Before (MASALAH)
const CACHE_NAME = 'laundry-management-v1-runtime';

// For static assets (js, css, images), use cache-first strategy
if (
  event.request.destination === 'script' ||
  event.request.destination === 'style' ||
  ...
) {
  const cached = await caches.match(event.request);
  if (cached) return cached; // ❌ Kode lama dikembalikan
}

// After (SOLUSI)
const APP_VERSION = '2.1.0';
const CACHE_NAME = `laundry-management-v${APP_VERSION}-runtime`;

// For JS and CSS: network-first to ensure fresh code
if (event.request.destination === 'script' || event.request.destination === 'style') {
  const response = await fetch(event.request, {
    cache: 'no-cache', // ✅ Force revalidation
  });
  // ... cache response for offline fallback
}
```

---

### 2. Disable Service Worker di Development

**File: `vite.config.ts`**

```typescript
// Before
registerType: 'autoUpdate',

// After
registerType: 'prompt', // User control
devOptions: {
  enabled: false, // ✅ No SW in dev mode
},
```

**Benefit:**
- Development lebih smooth, tidak ada cache issue
- Production tetap dapat manfaat PWA & offline mode

---

### 3. PWA Update Prompt Component

**File: `src/components/PWAUpdatePrompt.tsx`** (NEW)

Komponen baru yang menampilkan **notifikasi saat ada update** dengan pilihan:
- ✅ **Perbarui Sekarang** - Reload halaman dengan kode baru
- ✅ **Nanti** - Dismiss notifikasi, update nanti

**Features:**
- Auto-detect saat ada service worker baru
- User-friendly notification
- Non-intrusive (bisa dismiss)
- Dark mode compatible

**Integrasi di `App.tsx`:**
```tsx
import PWAUpdatePrompt from './components/PWAUpdatePrompt';

// Di AppRoutes component
<Layout>
  {/* ... routes */}
</Layout>
<PWAUpdatePrompt /> {/* ✅ Add this */}
```

---

### 4. Type Declarations untuk PWA

**File: `src/pwa-register.d.ts`** (NEW)

Type definitions untuk `virtual:pwa-register/react` agar TypeScript tidak error.

**File: `tsconfig.json`**

```json
"types": ["node", "vitest/globals", "vite-plugin-pwa/client"]
```

---

### 5. Tambah RefreshCwIcon

**File: `src/components/icons.tsx`**

Icon untuk tombol refresh di PWA update prompt.

---

## 🎯 Cara Kerja Solusi

### Saat Development (npm run dev):
1. Service Worker **DISABLED** → tidak ada cache issue
2. Hot Module Replacement (HMR) bekerja normal
3. Semua perubahan langsung terlihat

### Saat Production (npm run build):
1. Service Worker **ENABLED** dengan strategy baru
2. JS/CSS selalu dicoba ambil dari network dulu
3. Jika ada update baru:
   - PWAUpdatePrompt muncul
   - User klik "Perbarui Sekarang"
   - Service worker update & halaman reload
4. Cache hanya digunakan saat **offline**

---

## 📊 Comparison

| Aspek | Before (Masalah) | After (Solusi) |
|-------|------------------|----------------|
| **Login** | Perlu Ctrl+Shift+R | ✅ Login langsung |
| **Kode Update** | Tidak terdeteksi | ✅ Notifikasi muncul |
| **Cache Strategy (JS/CSS)** | Cache-first (❌ stale) | Network-first (✅ fresh) |
| **Cache Name** | Static `v1` | Dynamic `v2.1.0` |
| **Dev Mode** | SW aktif (❌ masalah) | SW disabled (✅ smooth) |
| **User Control** | Auto-update | ✅ Prompt with choice |
| **Offline Support** | ✅ Ada | ✅ Tetap ada |

---

## 🔄 Update Process Flow

```
User membuka app
      ↓
Service Worker check for updates
      ↓
Ada versi baru? → NO → Continue normal
      ↓ YES
PWAUpdatePrompt muncul
      ↓
User pilih:
  - "Perbarui Sekarang" → Reload dengan kode baru ✅
  - "Nanti" → Dismiss, update nanti saat refresh
```

---

## 🚀 Deployment Checklist

Saat deploy versi baru:

1. ✅ **Update `APP_VERSION` di `src/sw.js`**
   ```javascript
   const APP_VERSION = '2.2.0'; // Update ini
   ```

2. ✅ **Update `package.json` version**
   ```json
   "version": "2.2.0"
   ```

3. ✅ Build & Deploy
   ```bash
   npm run build
   # Deploy dist/ folder
   ```

4. User akan otomatis dapat notifikasi update saat buka app

---

## 🧪 Testing

### Test Cache Behavior:

1. **Development:**
   ```bash
   npm run dev
   # Buka http://localhost:3000
   # Ubah kode → hot reload langsung ✅
   ```

2. **Production (Local):**
   ```bash
   npm run build
   npm run preview
   # Buka http://localhost:4173
   # Service Worker aktif
   # Check Network tab → JS/CSS dari network ✅
   ```

3. **Test Update Flow:**
   ```bash
   # Deploy version 1
   # User buka app
   # Deploy version 2
   # User refresh → Update prompt muncul ✅
   ```

---

## 📝 Notes

- Cache invalidation sekarang otomatis via version-based cache name
- User selalu dapat kode terbaru saat online
- Offline mode tetap berfungsi dengan cache sebagai fallback
- **Tidak perlu lagi Ctrl+Shift+R** untuk login atau lihat update! 🎉

---

## 🔗 Related Files

- `src/sw.js` - Service worker dengan strategy baru
- `vite.config.ts` - PWA config & dev mode disable
- `src/components/PWAUpdatePrompt.tsx` - Update notification
- `src/App.tsx` - Integration point
- `src/pwa-register.d.ts` - Type declarations
- `tsconfig.json` - TypeScript config
- `src/components/icons.tsx` - RefreshCwIcon
