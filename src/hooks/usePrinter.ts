import * as React from 'react';
import useToasts from '../contexts/useToasts';
import {
  PrinterSettings,
  ReceiptLine,
  buildTestReceipt,
  describePrintError,
  getConnectedPrinterName,
  loadPrinterSettings,
  printReceipt,
  resetPrinterConnection,
  savePrinterSettings,
} from '../utils/thermalPrinter';

/**
 * State printer struk untuk perangkat ini (disimpan di browser, bukan di database),
 * dipakai bersama oleh halaman Struk dan halaman Pengaturan.
 */
export function usePrinter() {
  const { addToast } = useToasts();
  const [printerSettings, setPrinterSettings] =
    React.useState<PrinterSettings>(loadPrinterSettings);
  const [printing, setPrinting] = React.useState(false);
  const [connectedName, setConnectedName] = React.useState<string | null>(() =>
    getConnectedPrinterName(printerSettings.method),
  );

  const changePrinterSettings = (next: PrinterSettings) => {
    if (next.method !== printerSettings.method) {
      setConnectedName(getConnectedPrinterName(next.method));
    }
    setPrinterSettings(next);
    savePrinterSettings(next);
  };

  const runPrint = async (lines: ReceiptLine[], chooseDevice = false): Promise<boolean> => {
    setPrinting(true);
    try {
      if (chooseDevice) resetPrinterConnection();
      await printReceipt(lines, printerSettings, chooseDevice);
      setConnectedName(getConnectedPrinterName(printerSettings.method));
      return true;
    } catch (err) {
      setConnectedName(getConnectedPrinterName(printerSettings.method));
      addToast(describePrintError(err), 'error');
      return false;
    } finally {
      setPrinting(false);
    }
  };

  /** Props siap pakai untuk <PrinterSettingsPanel />. */
  const panelProps = {
    settings: printerSettings,
    onChange: changePrinterSettings,
    onTestPrint: () => void runPrint(buildTestReceipt(printerSettings)),
    onChooseDevice: () => void runPrint(buildTestReceipt(printerSettings), true),
    connectedName,
    busy: printing,
  };

  return { printerSettings, printing, runPrint, panelProps };
}
