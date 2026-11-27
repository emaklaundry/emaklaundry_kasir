import { parseVcf } from '../vcfParser';

describe('parseVcf', () => {
  it('parses vCard 3.0 with folded lines, multiple TEL, ADR and escapes', () => {
    const vcf = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Ayu Sari\\, S.Pd',
      'N:Sari;Ayu;;;',
      'TEL;TYPE=HOME:021-555',
      'TEL;TYPE=CELL:+62 812-3456-',
      ' 789',
      'ADR;TYPE=HOME:;;Jl. Merdeka 1;Bandung;Jawa Barat;40111;Indonesia',
      'EMAIL:ayu@example.com',
      'END:VCARD',
    ].join('\r\n');

    expect(parseVcf(vcf)).toEqual([
      {
        id: 'vcf-0',
        name: 'Ayu Sari, S.Pd',
        phone: '+62 812-3456-789',
        address: 'Jl. Merdeka 1, Bandung, Jawa Barat, 40111, Indonesia',
        email: 'ayu@example.com',
      },
    ]);
  });

  it('decodes Android vCard 2.1 quoted-printable names and falls back to N', () => {
    const vcf = [
      'BEGIN:VCARD',
      'VERSION:2.1',
      'N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:;Bu=20Ren=C3=A9=',
      '=20Laundry;;;',
      'TEL;CELL:0812345',
      'END:VCARD',
      'BEGIN:VCARD',
      'VERSION:2.1',
      'FN:Tanpa Nomor',
      'END:VCARD',
    ].join('\n');

    const result = parseVcf(vcf);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'Bu René Laundry', phone: '0812345' });
  });

  it('handles item-grouped TEL and tel: URIs (vCard 4.0)', () => {
    const vcf = 'BEGIN:VCARD\nVERSION:4.0\nFN:Budi\nitem1.TEL;VALUE=uri:tel:+628111\nEND:VCARD';
    expect(parseVcf(vcf)[0].phone).toBe('+628111');
  });
});
