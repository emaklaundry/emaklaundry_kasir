import React, { useState } from 'react';
import { WashType } from '@/types';
import {
  getRecommendationsByWashType,
  getMachineById,
  WashRecommendation,
} from '@/data/washingMachineData';
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
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧺</span>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Rekomendasi Setting Mesin
            </span>
          </div>
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
            <RecommendationCard recommendation={primaryRec} machine={machine} />
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🧺</span>
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
          Rekomendasi Setting Mesin Cuci
        </h3>
      </div>

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
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            {machine?.name || 'Mesin Cuci'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kapasitas: {machine?.capacity || recommendation.maxLoad}kg
          </p>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
          Direkomendasikan
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <SettingBadge label="Program" value={recommendation.program} icon="📋" />
        <SettingBadge label="Suhu" value={recommendation.temperature} icon="🌡️" />
        <SettingBadge label="Spin" value={`${recommendation.spinSpeed} RPM`} icon="🔄" />
        <SettingBadge
          label="Detergen"
          value={recommendation.detergentAmount}
          icon="🧴"
        />
      </div>

      {recommendation.notes && (
        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-2 rounded mb-3">
          💡 {recommendation.notes}
        </p>
      )}

      {recommendation.tips && recommendation.tips.length > 0 && (
        <div>
          <button
            onClick={() => setShowTips(!showTips)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
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
                <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <span className="text-green-500">✓</span>
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
  icon: string;
}

const SettingBadge: React.FC<SettingBadgeProps> = ({ label, value, icon }) => (
  <div className="text-center">
    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1.5">
      <span className="mr-1">{icon}</span>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  </div>
);

export default WashSettingsRecommendation;
