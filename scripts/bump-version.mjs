#!/usr/bin/env node
// Menaikkan versi aplikasi (semver) dan mencatatnya di CHANGELOG.md.
//
//   node scripts/bump-version.mjs patch   -> 2.7.1 -> 2.7.2  (perbaikan / update kecil)
//   node scripts/bump-version.mjs minor   -> 2.7.1 -> 2.8.0  (fitur baru / update besar)
//   node scripts/bump-version.mjs major   -> 2.7.1 -> 3.0.0  (perubahan besar yang tidak kompatibel)
//
// Flag --hook dipakai oleh .githooks/pre-commit: bump patch otomatis kecuali
// versi sudah dinaikkan manual di commit ini, lalu file versi di-stage ulang.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FILES = {
  pkg: 'package.json',
  lock: 'package-lock.json',
  sw: 'src/sw.js',
  changelog: 'CHANGELOG.md',
};

const args = process.argv.slice(2);
const fromHook = args.includes('--hook');
const level = args.find((a) => !a.startsWith('--')) ?? 'patch';

if (!['patch', 'minor', 'major'].includes(level)) {
  console.error(`Level tidak dikenal: "${level}". Gunakan patch, minor, atau major.`);
  process.exit(1);
}

const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const tryGit = (cmd) => {
  try {
    return git(cmd);
  } catch {
    return null;
  }
};

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const versionOf = (jsonText) => {
  try {
    return JSON.parse(jsonText).version ?? null;
  } catch {
    return null;
  }
};

const bump = (version, kind) => {
  const [major, minor, patch] = version.split('-')[0].split('.').map(Number);
  if ([major, minor, patch].some(Number.isNaN)) throw new Error(`Versi tidak valid: ${version}`);
  if (kind === 'major') return `${major + 1}.0.0`;
  if (kind === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

let stagedFiles = [];
if (fromHook) {
  if (process.env.SKIP_VERSION_BUMP) process.exit(0);

  stagedFiles = (tryGit('diff --cached --name-only') ?? '').split('\n').filter(Boolean);
  if (stagedFiles.length === 0) process.exit(0);

  // Versi sudah dinaikkan manual (npm run version:minor / major) di commit ini -> jangan bump lagi.
  const headVersion = versionOf(tryGit(`show HEAD:${FILES.pkg}`) ?? '');
  const stagedVersion = versionOf(tryGit(`show :${FILES.pkg}`) ?? '');
  if (headVersion && stagedVersion && headVersion !== stagedVersion) process.exit(0);

  // Jangan ikut men-stage perubahan yang sengaja belum di-stage di file versi.
  const unstaged = (tryGit('diff --name-only') ?? '').split('\n');
  const dirty = Object.values(FILES).filter((f) => unstaged.includes(f));
  if (dirty.length) {
    console.warn(
      `[versi] Bump otomatis dilewati: ada perubahan belum di-stage di ${dirty.join(', ')}.\n` +
        '        Stage file tersebut atau jalankan "npm run version:patch" manual.'
    );
    process.exit(0);
  }
} else {
  stagedFiles = [
    ...(tryGit('diff --cached --name-only') ?? '').split('\n'),
    ...(tryGit('diff --name-only') ?? '').split('\n'),
  ].filter(Boolean);
}

const pkg = readJson(FILES.pkg);
const oldVersion = pkg.version;
const newVersion = bump(oldVersion, level);

// package.json — ganti baris versi saja supaya format file tetap.
const pkgText = readFileSync(FILES.pkg, 'utf8');
writeFileSync(FILES.pkg, pkgText.replace(/("version"\s*:\s*")[^"]+(")/, `$1${newVersion}$2`));

// package-lock.json — versi root (dua tempat).
if (existsSync(FILES.lock)) {
  const lock = readJson(FILES.lock);
  lock.version = newVersion;
  if (lock.packages?.['']) lock.packages[''].version = newVersion;
  writeFileSync(FILES.lock, `${JSON.stringify(lock, null, 2)}\n`);
}

// src/sw.js — fallback versi cache bila __SW_VERSION__ tidak ter-inject.
if (existsSync(FILES.sw)) {
  const sw = readFileSync(FILES.sw, 'utf8');
  writeFileSync(
    FILES.sw,
    sw.replace(/(__SW_VERSION__\s*:\s*')[^']+(')/, `$1${newVersion}$2`)
  );
}

// CHANGELOG.md — entri baru paling atas.
const versionFiles = new Set(Object.values(FILES));
const areas = [
  ...new Set(
    stagedFiles
      .filter((f) => !versionFiles.has(f))
      .map((f) => {
        const parts = f.split('/');
        return parts[0] === 'src' && parts.length > 2 ? `${parts[0]}/${parts[1]}` : parts[0];
      })
  ),
];
const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
const branch = tryGit('rev-parse --abbrev-ref HEAD');
const levelLabel = { patch: 'update kecil', minor: 'update besar', major: 'rilis mayor' }[level];
const entry = [
  `## [${newVersion}] - ${date}`,
  '',
  `- Jenis: ${levelLabel} (${level})${branch ? ` · branch \`${branch}\`` : ''}`,
  ...(areas.length ? [`- Area berubah: ${areas.map((a) => `\`${a}\``).join(', ')}`] : []),
  '',
].join('\n');

const header =
  '# Changelog\n\nSemua perubahan versi Emak Laundry Kasir. Versi mengikuti semver: patch = update kecil, minor = update besar, major = perubahan yang tidak kompatibel.\n\n';
const existing = existsSync(FILES.changelog) ? readFileSync(FILES.changelog, 'utf8') : header;
const body = existing.startsWith(header) ? existing.slice(header.length) : existing.replace(/^# Changelog[^\n]*\n+/, '');
writeFileSync(FILES.changelog, `${header}${entry}\n${body}`);

if (fromHook) {
  const toStage = Object.values(FILES).filter((f) => existsSync(f));
  git(`add -- ${toStage.join(' ')}`);
}

console.log(`Versi: ${oldVersion} -> ${newVersion} (${level})`);
