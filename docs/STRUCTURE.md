# 📁 Project Structure Guide

Panduan lengkap struktur project Laundry Management System yang terorganisir dan mudah dinavigasi.

---

## 🎯 Project Structure

```
emaklaundry_kasir/
│
├── 📚 docs/                          # Documentation
│   ├── README.md                     # Documentation index
│   ├── FINAL_AUDIT_REPORT.md        # Comprehensive audit
│   ├── IMPROVEMENTS.md              # Implementation details
│   ├── DATA_CONSISTENCY.md          # Data strategy guide
│   ├── DEPLOYMENT.md                # Deployment instructions
│   └── STRUCTURE.md                 # This file
│
├── 💾 supabase/                      # Semua backend: setup, seeds, backup, migrations, functions
│   ├── setup/README.md              # Peta lengkap backend
│   ├── backup/                      # SQL backups
│   │   ├── README.md                # Backup guide
│   │   ├── complete_backup.sql      # Full backup
│   │   └── full_backup.sql          # All data backup
│   ├── seeds/                       # Additional seed data (modular)
│   │   ├── 00_full_seed_bundle.sql  # ⭐ ALL SEEDS BUNDLE (RECOMMENDED)
│   │   ├── seed_services.sql        # Services data
│   │   ├── seed_inventory.sql       # Inventory data
│   │   ├── seed_assets.sql          # Assets data
│   │   └── seed_maintenances.sql    # Maintenances data
│   └── setup/                       # Setup scripts
│       ├── 0.complete_setup.sql     # ⭐ ALL-IN-ONE setup (RECOMMENDED)
│       ├── 1.seed_data_awal.sql     # Basic seed data
│       ├── DEPLOYMENT.md            # DB deployment guide
│       ├── README.md                # Setup documentation
│       └── SETUP_GUIDE.md           # Setup instructions
│
├── 💻 src/                          # Source code
│   ├── components/                  # React components
│   │   ├── features/                # Feature-specific components
│   │   ├── layout/                  # Layout shell components
│   │   ├── modals/                  # Pop-up modals
│   │   ├── ui/                      # Generic UI Kit
│   │   └── widgets/                 # Dashboard widgets
│   ├── contexts/                    # State management
│   ├── hooks/                       # Custom hooks
│   ├── pages/                       # Page components
│   ├── types/                       # TypeScript definitions
│   ├── utils/                       # Utility functions
│   ├── __tests__/                   # 🧪 Test files (organized)
│   │   ├── components/              # Component tests
│   │   ├── contexts/                # Context tests
│   │   ├── hooks/                   # Hook tests
│   │   ├── pages/                   # Page tests
│   │   ├── utils/                   # Utility tests
│   │   └── README.md                # Testing guide
│   ├── App.tsx                      # Main app component
│   ├── index.tsx                    # Entry point
│   └── sw.js                        # Service worker (PWA)
│
├── 🌐 public/                       # Static assets
│   ├── favicon/                     # App icons (PWA)
│   └── manifest.webmanifest         # PWA manifest
│
├── ⚙️ supabase/                     # Supabase configuration
│   ├── config.toml                  # Supabase config
│   └── functions/                   # Edge functions
│
├── 🔄 .github/                      # GitHub automation
│   └── workflows/                   # Backup workflows
│
├── 🔧 Configuration Files (Root)
│   ├── .env                         # Environment variables (gitignored)
│   ├── eslint.config.js             # ESLint config
│   ├── package.json                 # Dependencies & scripts
│   ├── tailwind.config.js           # Tailwind config
│   ├── tsconfig.json                # TypeScript config
│   ├── vite.config.ts               # Vite build config
│   ├── vitest.config.ts             # Vitest test config
│   └── vercel.json                  # Vercel deployment
│
└── 📄 README.md                     # Main project readme

---

## ✅ Organization Principles

### 1. **Clear Separation of Concerns**

- **Documentation** → `docs/` folder
- **Database & backend** → `supabase/` folder (setup + seeds + backup + migrations + functions)
- **Source Code** → `src/` folder
- **Public Assets** → `public/` folder
- **Configuration** → Root level

### 2. **Component Architecture (New in v2.4+)**

```

src/components/
├── ui/ # Dumb/Pure components (Button, Input, Card)
├── layout/ # Structural components (Navbar, Sidebar)
├── features/ # Business logic components (TransactionList, ProductForm)
├── widgets/ # Dashboard widgets (StatsCard, Chart)
└── modals/ # Application modals (PaymentModal, UserModal)

```

### 3. **Clear Naming Conventions**

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase.tsx | `CustomerFormModal.tsx` |
| Utilities | camelCase.ts | `supabaseClient.ts` |
| Types | camelCase.ts | `database.types.ts` |
| Config | kebab-case.js | `eslint.config.js` |
| Documentation | UPPERCASE.md | `README.md` |

---

## 🎯 Quick Navigation Guide

### 👨‍💻 For Developers

**Starting point:**

1. Read [README.md](../README.md)
2. Check [STRUCTURE.md](./STRUCTURE.md) (this file)
3. Review [src/](../src/) folder

**Common tasks:**

- Add generic UI → `src/components/ui/`
- Add business UI → `src/components/features/`
- Add page → `src/pages/`
- Add hook → `src/hooks/`
- Add test → `src/__tests__/` ([Testing Guide](../src/__tests__/README.md))

### 🚀 For DevOps

**Deployment:**

1. [deployment/DEPLOYMENT.md](./deployment/DEPLOYMENT.md) - Full deployment guide
2. [supabase/setup/](../supabase/setup/) - DB setup scripts
3. `.env` - Environment configuration

**Database:**

- Setup → [supabase/setup/](../supabase/setup/0.complete_setup.sql)
- Seed → [supabase/setup/](../supabase/setup/1.seed_data_awal.sql)
- Content → [supabase/seeds/](../supabase/seeds/)

### 📊 For Project Managers

**Progress tracking:**

- [reports/IMPROVEMENTS.md](./reports/IMPROVEMENTS.md) - What's been done
- [reports/FINAL_AUDIT_REPORT.md](./reports/FINAL_AUDIT_REPORT.md) - Quality audit

---

## 📊 Project Statistics

### Code Organization

```

UI Components: 30+
Feature Components: 40+
Contexts: 15+ contexts
Pages: 10+ pages
Hooks: 15+ custom hooks
Utils: 10+ utilities

```

---

## 🔍 Important Files

### Entry Points

- [index.html](../index.html) - HTML entry
- [src/index.tsx](../src/index.tsx) - React entry
- [src/App.tsx](../src/App.tsx) - Main app

### Configuration

- [package.json](../package.json) - Dependencies & scripts
- [vite.config.ts](../vite.config.ts) - Build config
- [tsconfig.json](../tsconfig.json) - TypeScript config
- [tailwind.config.js](../tailwind.config.js) - Styling config

### Database

- [supabase/setup/0.complete_setup.sql](../supabase/setup/0.complete_setup.sql) - Complete schema setup
- [supabase/setup/1.seed_data_awal.sql](../supabase/setup/1.seed_data_awal.sql) - Basic seed data
- [supabase/seeds/00_full_seed_bundle.sql](../supabase/seeds/00_full_seed_bundle.sql) - Content bundle

---

**Structure organized:** December 26, 2024 (v2.7.0)
**Documentation:** Complete & up-to-date
```
