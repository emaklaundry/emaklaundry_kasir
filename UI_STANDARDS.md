# Standar UI Design System - Emak Laundry Kasir

## 🎨 Color Palette

### Primary Colors
- **Blue (Primary)**: bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
- **Green (Success)**: bg-green-600 hover:bg-green-700 disabled:bg-green-400
- **Red (Danger)**: bg-red-600 hover:bg-red-700 disabled:bg-red-400
- **Yellow (Warning)**: bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300
- **Slate (Secondary)**: bg-white border-slate-300 hover:bg-slate-100

### Dark Mode
- **Primary Dark**: dark:bg-blue-700 dark:hover:bg-blue-600
- **Secondary Dark**: dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600
- **Card Dark**: dark:bg-slate-800
- **Text Dark**: dark:text-white

---

## 🔘 Button Styles

### 1. Primary Button (Simpan, Submit, OK, Tambah)
```
bg-blue-600 hover:bg-blue-700 
text-white font-medium rounded-lg 
px-6 py-3 text-lg
disabled:bg-blue-400 disabled:cursor-not-allowed
```

### 2. Secondary Button (Batal, Kembali)
```
bg-white border border-slate-300 hover:bg-slate-100 
text-slate-700 font-medium rounded-lg 
px-6 py-3 text-lg
dark:bg-slate-700 dark:border-slate-600 
dark:text-slate-300 dark:hover:bg-slate-600
```

### 3. Success Button (Bayar, Selesai, Terima)
```
bg-green-600 hover:bg-green-700 
text-white font-medium rounded-lg 
px-6 py-3 text-lg
disabled:bg-green-400 disabled:cursor-not-allowed
```

### 4. Danger Button (Hapus, Delete)
```
bg-red-600 hover:bg-red-700 
text-white font-medium rounded-lg 
px-6 py-3 text-lg
disabled:bg-red-400 disabled:cursor-not-allowed
```

### 5. Warning Button (Nonaktifkan, Ubah Status)
```
bg-yellow-500 hover:bg-yellow-600 
text-white font-medium rounded-lg 
px-6 py-3 text-lg
disabled:bg-yellow-300 disabled:cursor-not-allowed
```

### 6. Icon Button (Edit, Hapus, Detail)
```
p-2.5 rounded-md 
hover:bg-slate-100 dark:hover:bg-slate-700
text-[color] hover:text-[color]-900 dark:text-[color]-400
```

**Variants:**
- Edit/Info: `text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white`
- Delete: `text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300`
- Success: `text-green-600 hover:text-green-900 dark:text-green-400`

---

## 📦 Card/Container Styles

### 1. Main Container (Page Wrapper)
```
bg-white dark:bg-slate-800 
p-6 rounded-lg shadow-md
```

### 2. Secondary Container (Sub-sections)
```
bg-slate-50 dark:bg-slate-800 
p-6 rounded-lg shadow-md
```

### 3. Stat Card (Dashboard)
```
bg-white dark:bg-slate-800 
p-6 rounded-lg shadow-md 
border-l-4 border-[color]
hover:bg-slate-50 dark:hover:bg-slate-700
transition-colors cursor-pointer
```

### 4. Table Header
```
bg-slate-50 dark:bg-slate-700 
text-sm text-slate-700 uppercase 
dark:text-slate-400
```

### 5. Info/Highlight Box
```
bg-blue-50 dark:bg-blue-900/50 
p-3 rounded-lg
border-l-4 border-blue-400
```

### 6. Mobile Card (Responsive)
```
bg-white dark:bg-slate-800 
p-4 rounded-lg shadow-md
border dark:border-slate-700
```

---

## 🎯 Input Styles

### 1. Text Input / Select
```
bg-white dark:bg-slate-700 
border border-slate-300 dark:border-slate-600 
text-slate-900 dark:text-white 
text-base rounded-lg block w-full p-3
focus:ring-blue-500 focus:border-blue-500
```

### 2. Checkbox
```
w-5 h-5 
text-blue-600 bg-slate-100 border-slate-300 
rounded focus:ring-blue-500
dark:bg-slate-700 dark:border-slate-600
```

### 3. Radio Button
```
w-4 h-4 
text-blue-600 bg-white border-slate-300 
focus:ring-blue-500
dark:bg-slate-700 dark:border-slate-600
```

---

## 📱 Modal Styles

### Modal Container
```
bg-white dark:bg-slate-800 
rounded-lg shadow-xl
max-w-[size] w-full
```

### Modal Header
```
flex items-center justify-between 
p-4 border-b border-slate-200 dark:border-slate-700 
rounded-t
```

### Modal Body
```
p-6 space-y-4
```

### Modal Footer
```
flex items-center justify-end 
p-4 space-x-2 
border-t border-slate-200 dark:border-slate-700 
rounded-b bg-slate-50 dark:bg-slate-800/50
```

---

## 📏 Spacing & Sizing

### Button Padding
- **Default**: `px-6 py-3`
- **Large**: `px-8 py-4`
- **Small**: `px-4 py-2`
- **Icon**: `p-2.5`

### Card Padding
- **Default**: `p-6`
- **Compact**: `p-4`
- **Dense**: `p-3`

### Text Sizes
- **Heading 1**: `text-2xl font-bold`
- **Heading 2**: `text-xl font-semibold`
- **Heading 3**: `text-lg font-semibold`
- **Body**: `text-base`
- **Small**: `text-sm`
- **Extra Small**: `text-xs`

### Border Radius
- **Default**: `rounded-lg`
- **Small**: `rounded-md`
- **Large**: `rounded-xl`
- **Full**: `rounded-full`

---

## 🎭 State Variants

### Hover States
- Primary: `hover:bg-blue-700`
- Secondary: `hover:bg-slate-100`
- Success: `hover:bg-green-700`
- Danger: `hover:bg-red-700`
- Warning: `hover:bg-yellow-600`

### Disabled States
- Primary: `disabled:bg-blue-400`
- Success: `disabled:bg-green-400`
- Danger: `disabled:bg-red-400`
- Warning: `disabled:bg-yellow-300`
- All: `disabled:cursor-not-allowed`

### Active/Selected States
```
border-blue-600 bg-blue-50 
dark:bg-blue-900/50 
ring-2 ring-blue-500
```

---

## 🌙 Dark Mode Guidelines

### Always Include Dark Mode for:
1. All backgrounds (bg-* → dark:bg-*)
2. All text colors (text-* → dark:text-*)
3. All borders (border-* → dark:border-*)
4. All hover states (hover:bg-* → dark:hover:bg-*)

### Common Dark Mode Pairs:
- `bg-white` → `dark:bg-slate-800`
- `bg-slate-50` → `dark:bg-slate-800`
- `bg-slate-100` → `dark:bg-slate-700`
- `text-slate-900` → `dark:text-white`
- `text-slate-700` → `dark:text-slate-300`
- `text-slate-500` → `dark:text-slate-400`
- `border-slate-300` → `dark:border-slate-600`
- `border-slate-200` → `dark:border-slate-700`

---

## ✅ Checklist Consistency

Saat membuat komponen baru:
- [ ] Gunakan warna button yang sesuai dengan fungsinya
- [ ] Tambahkan dark mode untuk semua warna
- [ ] Gunakan disabled state yang konsisten
- [ ] Padding button konsisten (px-6 py-3)
- [ ] Text size konsisten (text-lg untuk button)
- [ ] Border radius konsisten (rounded-lg)
- [ ] Icon button menggunakan p-2.5
- [ ] Card menggunakan bg-white dark:bg-slate-800
- [ ] Input menggunakan p-3 dan border yang sama

---

## 🚀 Migration Notes

### Files Requiring Update:
1. **TransactionDetailPage.tsx** - Standardize button colors (blue-600, green-600)
2. **QuickActionsPage.tsx** - Change bg-blue-500 → bg-blue-600, bg-green-500 → bg-green-600
3. **LoginPage.tsx** - Change bg-blue-700 → bg-blue-600
4. **All Icon Buttons** - Standardize to p-2.5
5. **All Secondary Buttons** - Add dark:hover:bg-slate-600
6. **ReportsPage Cards** - Standardize to bg-white dark:bg-slate-800

### Priority:
1. 🔴 HIGH: Button primary colors (blue, green)
2. 🟡 MEDIUM: Icon button padding
3. 🟢 LOW: Card background variations

---

**Last Updated:** December 13, 2025  
**Version:** 1.0.0
