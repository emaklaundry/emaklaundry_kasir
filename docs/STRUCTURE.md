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
├── 💾 database/                      # Database files
│   ├── README.md                    # Database documentation
│   ├── backup/                      # SQL backups
│   │   ├── database-backup.md       # Backup guide
│   │   ├── full_backup.sql          # Latest full backup
│   │   └── data_1.sql               # Old backup (reference)
│   └── setup/                       # Setup scripts
│       ├── complete_setup.sql       # ⭐ ALL-IN-ONE setup (RECOMMENDED)
│       ├── 0.droptable.sql          # Drop tables (optional)
│       ├── 1.database.sql           # Schema & triggers
│       ├── 2.apply_rpc_and_seed.sql # RPC & seed data
│       ├── 3.security_and_performance.sql # Indexes & security
│       ├── 4.add_maintenance_mode.sql # Maintenance mode
│       ├── DEPLOYMENT.md            # DB deployment guide
│       └── SETUP_GUIDE.md           # Setup instructions
│
├── 💻 src/                          # Source code
│   ├── components/                  # React components (70+ files)
│   ├── contexts/                    # State management
│   ├── hooks/                       # Custom hooks
│   ├── pages/                       # Page components
│   ├── types/                       # TypeScript definitions
│   ├── utils/                       # Utility functions
│   ├── __tests__/                   # 🧪 Test files (78 files organized)
│   │   ├── components/              # Component tests (34 files)
│   │   ├── contexts/                # Context tests (13 files)
│   │   ├── hooks/                   # Hook tests (5 files)
│   │   ├── pages/                   # Page tests (14 files)
│   │   ├── utils/                   # Utility tests (7 files)
│   │   ├── types/                   # Type tests (3 files)
│   │   ├── integration/             # Integration tests (2 files)
│   │   └── README.md                # Testing guide
│   ├── App.tsx                      # Main app component
│   ├── index.tsx                    # Entry point
│   └── sw.js                        # Service worker (PWA)
│
├── 🌐 public/                       # Static assets
│   ├── favicon/                     # App icons
│   │   ├── android-chrome-192x192.png
│   │   ├── android-chrome-512x512.png
│   │   ├── apple-touch-icon.png
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   ├── favicon.ico
│   │   └── site.webmanifest
│   └── manifest.webmanifest         # PWA manifest
│
├── ⚙️ supabase/                     # Supabase configuration
│   ├── config.toml                  # Supabase config
│   └── functions/                   # Edge functions
│       └── create-user/             # User creation function
│
├── 🔄 .github/                      # GitHub automation
│   └── workflows/
│       ├── backup.yml               # Daily database backup
│       └── README.md                # Workflow documentation
│
├── 🔧 Configuration Files (Root)
│   ├── .env                         # Environment variables (gitignored)
│   ├── .gitignore                   # Git ignore rules
│   ├── eslint.config.js             # ESLint config
│   ├── package.json                 # Dependencies & scripts
│   ├── postcss.config.cjs           # PostCSS config
│   ├── tailwind.config.js           # Tailwind config
│   ├── tsconfig.json                # TypeScript config
│   ├── vite.config.ts               # Vite build config
│   ├── vitest.config.ts             # Vitest test config
│   ├── vitest.setup.ts              # Test setup
│   └── vercel.json                  # Vercel deployment
│
├── 📄 README.md                     # Main project readme
├── 📄 index.html                    # Entry HTML
│
└── 🗑️ Generated (gitignored)
    ├── node_modules/                # Dependencies
    ├── dist/                        # Build output
    ├── coverage/                    # Test coverage
    └── .supabase/                   # Supabase local data
```
│   ├── vitest.config.ts             # Vitest test config
│   ├── vitest.setup.ts              # Test setup
│   └── vercel.json                  # Vercel deployment
│
├── 📄 README.md                     # Main project readme
├── 📄 index.html                    # Entry HTML
│
└── 🗑️ Generated (gitignored)
    ├── node_modules/                # Dependencies
    ├── dist/                        # Build output
    └── coverage/                    # Test coverage
```

---

## ✅ Organization Principles

### 1. **Clear Separation of Concerns**
- **Documentation** → `docs/` folder
- **Database** → `database/` folder (setup + backup)
- **Source Code** → `src/` folder
- **Public Assets** → `public/` folder
- **Configuration** → Root level

### 2. **Logical Grouping**
```
📦 Feature-based organization:
src/
├── components/     # Reusable UI components
├── contexts/       # Global state
├── hooks/          # Reusable logic
├── pages/          # Route components
├── types/          # Type definitions
└── utils/          # Helper functions
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
- Add component → `src/components/`
- Add page → `src/pages/`
- Add hook → `src/hooks/`
- Add types → `src/types/`
- Add test → `src/__tests__/` ([Testing Guide](../src/__tests__/README.md))
- Run tests → `npm run test`

### 🚀 For DevOps
**Deployment:**
1. [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
2. [database/setup/](../database/setup/) - DB setup scripts
3. `.env` - Environment configuration

**Database:**
- Setup → [database/setup/](../database/setup/)
- Backup → [database/backup/](../database/backup/)
- Guide → [database/README.md](../database/README.md)

### 📊 For Project Managers
**Progress tracking:**
- [IMPROVEMENTS.md](./IMPROVEMENTS.md) - What's been done
- [FINAL_AUDIT_REPORT.md](./FINAL_AUDIT_REPORT.md) - Quality audit
- [DATA_CONSISTENCY.md](./DATA_CONSISTENCY.md) - Data reliability

---

## 📊 Project Statistics

### File Count
```
Documentation:        6 files
Database scripts:     8 files
Source files:       150+ files
Test files:          78 test files (organized in __tests__/)
Config files:        13 files
Public assets:       10+ files
```

### Code Organization
```
Components:          70+ components
Contexts:            15+ contexts
Pages:               10+ pages
Hooks:               15+ custom hooks
Utils:               10+ utilities
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
- [database/setup/1.database.sql](../database/setup/1.database.sql) - Main schema
- [database/backup/full_backup.sql](../database/backup/full_backup.sql) - Latest backup

---

**Structure organized:** December 14, 2025  
**Documentation:** Complete & up-to-date
