/**
 * Parser file vCard (.vcf) hasil export kontak dari HP (Android/iPhone),
 * Google Contacts, atau Outlook. Mendukung vCard 2.1, 3.0, dan 4.0:
 * - baris terlipat (line folding) diawali spasi/tab
 * - ENCODING=QUOTED-PRINTABLE (umum di export Android) termasuk soft line break "="
 * - escape \n \, \; \\
 */

export interface VcfContact {
  /** Kunci unik dalam satu file, dipakai untuk pilihan di UI. */
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
}

interface VcfProperty {
  name: string;
  params: Record<string, string[]>;
  value: string;
}

const decodeQuotedPrintable = (input: string, charset: string): string => {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '=' && /^[0-9A-Fa-f]{2}$/.test(input.slice(i + 1, i + 3))) {
      bytes.push(parseInt(input.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      // Karakter non-ASCII mentah: encode ulang sebagai UTF-8.
      bytes.push(...new TextEncoder().encode(ch));
    }
  }
  try {
    return new TextDecoder(charset || 'utf-8').decode(new Uint8Array(bytes));
  } catch {
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  }
};

const unescapeValue = (value: string): string =>
  value.replace(/\\([nN,;\\])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c));

/** Pisah berdasarkan pemisah yang tidak di-escape (mis. ";" pada N/ADR). */
const splitUnescaped = (value: string, sep: string): string[] => {
  const parts: string[] = [];
  let current = '';
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '\\' && i + 1 < value.length) {
      current += value[i] + value[i + 1];
      i++;
    } else if (value[i] === sep) {
      parts.push(current);
      current = '';
    } else {
      current += value[i];
    }
  }
  parts.push(current);
  return parts.map(unescapeValue);
};

/** Gabungkan baris terlipat & soft line break quoted-printable. */
const unfoldLines = (text: string): string[] => {
  const raw = text.replace(/\r\n?/g, '\n').split('\n');
  const lines: string[] = [];
  for (const line of raw) {
    const prev = lines[lines.length - 1];
    if ((line.startsWith(' ') || line.startsWith('\t')) && prev !== undefined) {
      lines[lines.length - 1] = prev + line.slice(1);
    } else if (
      prev !== undefined &&
      /QUOTED-PRINTABLE/i.test(prev.split(':')[0]) &&
      prev.endsWith('=')
    ) {
      lines[lines.length - 1] = prev.slice(0, -1) + line;
    } else {
      lines.push(line);
    }
  }
  return lines;
};

const parseLine = (line: string): VcfProperty | null => {
  const colon = line.indexOf(':');
  if (colon <= 0) return null;
  const head = line.slice(0, colon);
  let value = line.slice(colon + 1);

  const [rawName, ...rawParams] = head.split(';');
  // Buang prefix grup, mis. "item1.TEL" -> "TEL".
  const name = rawName.split('.').pop()!.toUpperCase();

  const params: Record<string, string[]> = {};
  for (const p of rawParams) {
    const eq = p.indexOf('=');
    // vCard 2.1 boleh menulis "TEL;CELL:..." tanpa "TYPE=".
    const key = eq === -1 ? 'TYPE' : p.slice(0, eq).toUpperCase();
    const vals = (eq === -1 ? p : p.slice(eq + 1))
      .replace(/"/g, '')
      .split(',')
      .map((v) => v.trim().toUpperCase())
      .filter(Boolean);
    params[key] = [...(params[key] ?? []), ...vals];
  }

  if (params.ENCODING?.includes('QUOTED-PRINTABLE')) {
    value = decodeQuotedPrintable(value, params.CHARSET?.[0]?.toLowerCase() ?? 'utf-8');
  }

  return { name, params, value };
};

const pickPhone = (tels: VcfProperty[]): string => {
  if (tels.length === 0) return '';
  const types = (t: VcfProperty) => t.params.TYPE ?? [];
  const preferred =
    tels.find((t) => types(t).includes('PREF') || t.params.PREF) ??
    tels.find((t) => types(t).includes('CELL')) ??
    tels[0];
  return unescapeValue(preferred.value).replace(/^tel:/i, '').trim();
};

const formatAddress = (adr: VcfProperty | undefined): string => {
  if (!adr) return '';
  // ADR: PO Box;Extended;Street;Locality;Region;Postal;Country
  return splitUnescaped(adr.value, ';')
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean)
    .join(', ');
};

const formatName = (fn: VcfProperty | undefined, n: VcfProperty | undefined): string => {
  const full = fn ? unescapeValue(fn.value).trim() : '';
  if (full) return full;
  if (!n) return '';
  // N: Family;Given;Additional;Prefix;Suffix
  const [family = '', given = '', additional = '', prefix = '', suffix = ''] = splitUnescaped(
    n.value,
    ';',
  );
  return [prefix, given, additional, family, suffix]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ');
};

/**
 * Parse isi file .vcf menjadi daftar kontak. Kontak tanpa nama atau
 * tanpa nomor telepon diabaikan karena tidak bisa jadi data pelanggan.
 */
export function parseVcf(text: string): VcfContact[] {
  const contacts: VcfContact[] = [];
  let card: VcfProperty[] | null = null;

  const BOM = String.fromCharCode(0xfeff);
  const body = text.startsWith(BOM) ? text.slice(1) : text;
  for (const line of unfoldLines(body)) {
    const trimmed = line.trim();
    if (/^BEGIN:VCARD$/i.test(trimmed)) {
      card = [];
      continue;
    }
    if (/^END:VCARD$/i.test(trimmed)) {
      if (card) {
        const get = (name: string) => card!.find((p) => p.name === name);
        const name = formatName(get('FN'), get('N'));
        const phone = pickPhone(card.filter((p) => p.name === 'TEL'));
        if (name && phone) {
          const email = get('EMAIL');
          contacts.push({
            id: `vcf-${contacts.length}`,
            name,
            phone,
            address: formatAddress(get('ADR')),
            email: email ? unescapeValue(email.value).trim() || undefined : undefined,
          });
        }
      }
      card = null;
      continue;
    }
    if (card) {
      const prop = parseLine(line);
      if (prop) card.push(prop);
    }
  }

  return contacts;
}
