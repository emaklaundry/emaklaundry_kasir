import * as React from 'react';
import type { ReceiptLine } from '@/utils/thermalPrinter';

interface Props {
  lines: ReceiptLine[];
  /** Lebar kertas (mm) — dipakai CSS cetak lewat `--receipt-width`. */
  paperWidthMm: number;
  className?: string;
}

/**
 * Pratinjau struk dari baris yang sama persis dengan yang dikirim ke printer.
 * Elemen ini juga yang tercetak saat HP mencetak seluruh halaman (lihat `.receipt-print`
 * di index.css), jadi tampilan layar = hasil cetak di semua perangkat.
 */
const ReceiptPreview: React.FC<Props> = ({ lines, paperWidthMm, className = '' }) => (
  <div
    className={`receipt-print receipt-paper ${className}`}
    style={{ '--receipt-width': `${paperWidthMm}mm` } as React.CSSProperties}
  >
    {lines.map((line, i) => {
      if (line.type === 'blank') return <div key={i} className="rc-sp" />;
      if (line.type === 'divider') return <div key={i} className="rc-d" aria-hidden="true" />;
      if (line.type === 'pair') {
        return (
          <div key={i} className={`rc-p${line.bold ? ' rc-b' : ''}`}>
            <span>{line.left}</span>
            <span className="rc-r">{line.right}</span>
          </div>
        );
      }
      const cls = ['rc-l', line.bold ? 'rc-b' : '', line.size === 'large' ? 'rc-lg' : '']
        .filter(Boolean)
        .join(' ');
      return (
        <div key={i} className={cls} style={{ textAlign: line.align ?? 'left' }}>
          {line.text}
        </div>
      );
    })}
  </div>
);

export default ReceiptPreview;
