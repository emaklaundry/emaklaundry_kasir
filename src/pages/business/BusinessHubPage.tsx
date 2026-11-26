import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  BookOpenIcon,
  CalculatorIcon,
  SpinnerIcon,
} from '../../components/icons';

const BusinessGuidePage = lazy(() => import('../BusinessGuidePage'));
const BusinessCalculatorPage = lazy(() => import('./BusinessCalculatorPage'));
const DocumentationPage = lazy(() => import('../DocumentationPage'));

export type BusinessHubTab = 'panduan' | 'kalkulator' | 'dokumentasi';

const TABS: {
  id: BusinessHubTab;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'panduan',
    label: 'Panduan Bisnis',
    description: 'Rumus harga, metrik penting & strategi',
    icon: ArrowTrendingUpIcon,
  },
  {
    id: 'kalkulator',
    label: 'Kalkulator Bisnis',
    description: 'Simulasi omzet, biaya & balik modal',
    icon: CalculatorIcon,
  },
  {
    id: 'dokumentasi',
    label: 'Dokumentasi',
    description: 'Cara pakai aplikasi & perawatan mesin',
    icon: BookOpenIcon,
  },
];

const isTab = (value: string | null): value is BusinessHubTab =>
  TABS.some((tab) => tab.id === value);

const TabLoader: React.FC = () => (
  <div className="flex h-64 items-center justify-center" role="status">
    <SpinnerIcon className="h-10 w-10 text-brand-blue-600 dark:text-brand-blue-400" />
    <span className="sr-only">Memuat…</span>
  </div>
);

/** Panduan Bisnis, Kalkulator Bisnis, dan Dokumentasi dalam satu halaman (khusus Admin). */
const BusinessHubPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const activeTab: BusinessHubTab = isTab(requested) ? requested : 'panduan';

  const selectTab = (tab: BusinessHubTab) => {
    setSearchParams(tab === 'panduan' ? {} : { tab }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <p className="text-slate-600 dark:text-slate-400">
        Panduan, kalkulator, dan dokumentasi untuk mengelola usaha laundry.
      </p>

      <div
        role="tablist"
        aria-label="Bagian Pusat Bisnis"
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`business-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls="business-tab-panel"
              onClick={() => selectTab(tab.id)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                selected
                  ? 'border-brand-blue-500 bg-brand-blue-50 dark:border-brand-blue-400 dark:bg-brand-blue-900/30'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50'
              }`}
            >
              <tab.icon
                className={`h-6 w-6 shrink-0 ${
                  selected
                    ? 'text-brand-blue-600 dark:text-brand-blue-300'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span className="min-w-0">
                <span
                  className={`block font-semibold ${
                    selected
                      ? 'text-brand-blue-700 dark:text-brand-blue-200'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {tab.label}
                </span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  {tab.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div id="business-tab-panel" role="tabpanel" aria-labelledby={`business-tab-${activeTab}`}>
        <Suspense fallback={<TabLoader />}>
          {activeTab === 'panduan' && <BusinessGuidePage />}
          {activeTab === 'kalkulator' && <BusinessCalculatorPage />}
          {activeTab === 'dokumentasi' && <DocumentationPage />}
        </Suspense>
      </div>
    </div>
  );
};

export default BusinessHubPage;
