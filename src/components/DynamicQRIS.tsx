import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateDynamicQRIS, getMerchantName, formatQRISAmount } from '@/utils/qrisUtils';

interface DynamicQRISProps {
  staticQRIS: string;
  amount: number;
  size?: number;
  showAmount?: boolean;
  className?: string;
}

/**
 * Dynamic QRIS Component
 * Generates a QR code with embedded transaction amount
 */
const DynamicQRIS: React.FC<DynamicQRISProps> = ({
  staticQRIS,
  amount,
  size = 200,
  showAmount = true,
  className = '',
}) => {
  const { dynamicQRIS, merchantName, error } = useMemo(() => {
    try {
      if (!staticQRIS || staticQRIS.length < 50) {
        return { dynamicQRIS: null, merchantName: '', error: 'QRIS tidak valid' };
      }

      const qris = generateDynamicQRIS(staticQRIS, amount);
      const name = getMerchantName(staticQRIS);

      return { dynamicQRIS: qris, merchantName: name, error: null };
    } catch (err) {
      console.error('Failed to generate dynamic QRIS:', err);
      return { dynamicQRIS: null, merchantName: '', error: 'Gagal generate QRIS' };
    }
  }, [staticQRIS, amount]);

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg ${className}`}
      >
        <p className="text-red-600 dark:text-red-400 text-sm text-center">⚠️ {error}</p>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Silakan setting QRIS di Pengaturan
        </p>
      </div>
    );
  }

  if (!dynamicQRIS) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* QR Code */}
      <div className="bg-white p-3 rounded-lg shadow-md">
        <QRCodeSVG
          value={dynamicQRIS}
          size={size}
          level="M"
          includeMargin={false}
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>

      {/* Amount Display */}
      {showAmount && (
        <div className="mt-3 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatQRISAmount(amount)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{merchantName}</p>
        </div>
      )}

      {/* Scan Instructions */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
        Scan dengan aplikasi e-wallet atau m-banking
      </p>
    </div>
  );
};

export default DynamicQRIS;
