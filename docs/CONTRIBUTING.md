# Emak Laundry - Contributing Guide

Terima kasih atas minat Anda untuk berkontribusi! 🎉

## 📋 Sebelum Memulai

1. Fork repository ini
2. Clone fork Anda: `git clone https://github.com/YOUR_USERNAME/emaklaundry_kasir.git`
3. Install dependencies: `npm install`
4. Setup environment: `cp .env.example .env`
5. Baca [README.md](README.md) dan [docs/](docs/)

## 🔨 Development Workflow

### 1. Buat Branch Baru
```bash
git checkout -b feature/nama-fitur
# atau
git checkout -b fix/nama-bug
```

### 2. Coding Standards
- **Format:** Run `npm run format` sebelum commit
- **Lint:** Run `npm run lint` untuk cek errors
- **Test:** Run `npm test` untuk cek semua test pass
- **All checks:** Run `npm run test:all`

### 3. Commit Messages
Format: `type: deskripsi singkat`

**Types:**
- `feat`: Fitur baru
- `fix`: Bug fix
- `docs`: Dokumentasi
- `style`: Format code (tidak mengubah logic)
- `refactor`: Refactor code
- `test`: Tambah/update tests
- `chore`: Maintenance

**Examples:**
```bash
git commit -m "feat: tambah fitur export laporan ke Excel"
git commit -m "fix: perbaiki bug kalkulasi total transaksi"
git commit -m "docs: update README dengan setup database"
```

### 4. Testing
```bash
# Run semua test
npm test

# Run test spesifik
npm test -- ComponentName.test.tsx

# Watch mode
npm test -- --watch
```

Pastikan:
- ✅ Semua test pass
- ✅ Coverage tidak turun
- ✅ Tambah test untuk fitur baru

### 5. Pull Request

**Before submitting:**
```bash
npm run test:all  # Format + Lint + Test
```

**PR Template:**
```markdown
## Deskripsi
[Jelaskan perubahan yang dibuat]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Code mengikuti style guide
- [ ] Sudah run `npm run test:all`
- [ ] Semua test pass
- [ ] Dokumentasi sudah diupdate
- [ ] Tidak ada TypeScript errors
```

## 🎯 Areas to Contribute

### 🐛 Bug Fixes
- Cek [Issues](../../issues) dengan label `bug`
- Reproduce bug terlebih dahulu
- Tambahkan test untuk regression

### ✨ New Features
- Diskusi di [Discussions](../../discussions) dulu
- Pastikan align dengan roadmap
- Update dokumentasi

### 📚 Documentation
- Typo fixes
- Improve clarity
- Add examples
- Translate to English

### 🧪 Testing
- Increase coverage
- Add edge cases
- Integration tests

## 🏗️ Project Structure

```
src/
├── components/    # React components
├── contexts/      # Global state
├── hooks/         # Custom hooks
├── pages/         # Route pages
├── utils/         # Helper functions
└── __tests__/     # Test files
```

## 🔒 Security

Jika menemukan security vulnerability:
- **JANGAN** buat public issue
- Email: mhmdnvn18@gmail.com
- Akan direspon dalam 48 jam

## 📝 Code Review Process

1. **Automated checks** - CI/CD harus pass
2. **Code review** - Minimal 1 approval
3. **Testing** - Manual test di staging
4. **Merge** - Squash & merge ke main

## 💡 Tips

- Gunakan TypeScript strict mode
- Follow React best practices
- Keep components small & focused
- Write self-documenting code
- Add JSDoc untuk complex logic

## 🤝 Community

- Respectful & inclusive
- Help others learn
- Give constructive feedback
- Celebrate contributions

## 📧 Contact

Questions? Reach out:
- Email: mhmdnvn18@gmail.com
- [GitHub Discussions](../../discussions)

---

**Thank you for contributing!** 🙏
