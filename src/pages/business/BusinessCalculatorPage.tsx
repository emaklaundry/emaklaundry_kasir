import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PlanTab from './PlanTab';
import ComparisonTab from './ComparisonTab';

type CalculatorView = 'rencana' | 'perbandingan';

const VIEWS: { id: CalculatorView; label: string; description: string }[] = [
  { id: 'rencana', label: 'Rencana', description: 'Simulasi dan simpan target cabang' },
  { id: 'perbandingan', label: 'Perbandingan', description: 'Target dibanding realisasi' },
];

const isView = (value: string | null): value is CalculatorView => VIEWS.some((v) => v.id === value);

/** Kalkulator Bisnis: sub-tab Rencana (simulasi + target) dan Perbandingan. */
const BusinessCalculatorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('view');
  const activeView: CalculatorView = isView(requested) ? requested : 'rencana';

  const selectView = (view: CalculatorView) => {
    const next = new URLSearchParams(searchParams);
    if (view === 'rencana') next.delete('view');
    else next.set('view', view);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Bagian Kalkulator Bisnis"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {VIEWS.map((view) => {
          const selected = view.id === activeView;
          return (
            <button
              key={view.id}
              type="button"
              role="tab"
              id={`calculator-view-${view.id}`}
              aria-selected={selected}
              aria-controls="calculator-view-panel"
              onClick={() => selectView(view.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selected
                  ? 'border-brand-blue-500 bg-brand-blue-50 dark:border-brand-blue-400 dark:bg-brand-blue-900/30'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50'
              }`}
            >
              <span
                className={`block font-semibold ${
                  selected
                    ? 'text-brand-blue-700 dark:text-brand-blue-200'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {view.label}
              </span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">
                {view.description}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="calculator-view-panel"
        role="tabpanel"
        aria-labelledby={`calculator-view-${activeView}`}
      >
        {activeView === 'rencana' && <PlanTab />}
        {activeView === 'perbandingan' && <ComparisonTab />}
      </div>
    </div>
  );
};

export default BusinessCalculatorPage;
