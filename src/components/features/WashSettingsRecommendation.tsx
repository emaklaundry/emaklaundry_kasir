import React, { useState } from 'react';
import { WashType } from '@/types';
import {
  getRecommendationsByWashType,
  getMachineById,
  WashRecommendation,
} from '@/data/washingMachineData';
import { Check, WashingMachine } from 'lucide-react';
import { ChevronDownIcon, ChevronRightIcon } from '../icons';

interface WashSettingsRecommendationProps {
  washType: WashType;
  compact?: boolean;
}

const WashSettingsRecommendation: React.FC<WashSettingsRecommendationProps> = ({
  washType,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const recommendations = getRecommendationsByWashType(washType);

  if (recommendations.length === 0) {
    return null;
  }

  const primaryRec = recommendations[0];
  const machine = getMachineById(primaryRec.machineId);

  if (compact) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex w-full items-center justify-between gap-2 rounded-lg p-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <WashingMachine
              className="h-5 w-5 text-slate-500 dark:text-slate-400"
              aria-hidden="true"
            />
            Rekomendasi Setting Mesin
          </span>
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          )}
        </button>

        {isExpanded && (
          <div className="px-3 pb-3">
            <RecommendationCard recommendation={primaryRec} machine={machine} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
        <WashingMachine className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden="true" />
        Rekomendasi Setting Mesin Cuci
      </h3>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const m = getMachineById(rec.machineId);
          return <RecommendationCard key={index} recommendation={rec} machine={m} />;
        })}
      </div>
    </div>
  );
};

interface RecommendationCardProps {
  recommendation: WashRecommendation;
  machine?: { name: string; capacity: number };
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, machine }) => {
  const [showTips, setShowTips] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            {machine?.name || 'Mesin Cuci'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kapasitas: {machine?.capacity || recommendation.maxLoad}kg
          </p>
        </div>
        <span className="badge badge-success">Direkomendasikan</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <SettingBadge label="Program" value={recommendation.program} />
        <SettingBadge label="Suhu" value={recommendation.temperature} />
        <SettingBadge label="Spin" value={`${recommendation.spinSpeed} RPM`} />
        <SettingBadge label="Detergen" value={recommendation.detergentAmount} />
      </div>

      {recommendation.notes && (
        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-2 rounded mb-3">
          {recommendation.notes}
        </p>
      )}

      {recommendation.tips && recommendation.tips.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            aria-expanded={showTips}
            className="flex items-center gap-1 text-sm font-medium text-brand-blue-700 hover:underline dark:text-brand-blue-300"
          >
            {showTips ? 'Sembunyikan tips' : 'Lihat tips perawatan'}
            {showTips ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronRightIcon className="w-3 h-3" />
            )}
          </button>

          {showTips && (
            <ul className="mt-2 space-y-1">
              {recommendation.tips.map((tip, i) => (
                <li
                  key={i}
                  className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400"
                    aria-hidden="true"
                  />
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

interface SettingBadgeProps {
  label: string;
  value: string;
}

const SettingBadge: React.FC<SettingBadgeProps> = ({ label, value }) => (
  <div className="text-center">
    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1.5">
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  </div>
);

export default WashSettingsRecommendation;
