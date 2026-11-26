import React, { useState } from 'react';
import Modal from './Modal';
import { WashType } from '@/types';
import { washingMachines, getMachineById } from '@/data/washingMachineData';
import WashSettingsRecommendation from './features/WashSettingsRecommendation';

interface WashSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WashSettingsModal: React.FC<WashSettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'by-type' | 'by-machine'>('by-type');
  const [selectedWashType, setSelectedWashType] = useState<WashType>(WashType.Pakaian);
  const [selectedMachineId, setSelectedMachineId] = useState<string>(washingMachines[0]?.id || '');

  const washTypes = Object.values(WashType);
  const selectedMachine = getMachineById(selectedMachineId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Panduan Setting Mesin Cuci">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
        <button
          onClick={() => setActiveTab('by-type')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'by-type'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Berdasarkan Jenis Cucian
        </button>
        <button
          onClick={() => setActiveTab('by-machine')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'by-machine'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Info Mesin Cuci
        </button>
      </div>

      {activeTab === 'by-type' && (
        <div className="space-y-4">
          {/* Wash Type Selector */}
          <div>
            <label htmlFor="wash-type-select" className="form-label">
              Pilih Jenis Cucian
            </label>
            <select
              id="wash-type-select"
              value={selectedWashType}
              onChange={(e) => setSelectedWashType(e.target.value as WashType)}
              className="form-input"
            >
              {washTypes.map((type) => (
                <option key={type} value={type}>
                  {getWashTypeEmoji(type)} {type}
                </option>
              ))}
            </select>
          </div>

          {/* Recommendations */}
          <WashSettingsRecommendation washType={selectedWashType} />
        </div>
      )}

      {activeTab === 'by-machine' && (
        <div className="space-y-4">
          {/* Machine Selector */}
          <div>
            <label htmlFor="machine-select" className="form-label">
              Pilih Mesin Cuci
            </label>
            <select
              id="machine-select"
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="form-input"
            >
              {washingMachines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.name} ({machine.capacity}kg)
                </option>
              ))}
            </select>
          </div>

          {/* Machine Info */}
          {selectedMachine && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  📋 Informasi Mesin
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Model:</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedMachine.model}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Serial:</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedMachine.serialNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Kapasitas:</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedMachine.capacity} kg
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Tipe:</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedMachine.type === 'front-load' ? 'Front Load' : 'Top Load'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  🔧 Program yang Tersedia
                </h4>
                <div className="space-y-2">
                  {selectedMachine.programs.map((program, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {program.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {program.nameId}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Suhu:</span>
                          <p className="text-slate-700 dark:text-slate-300">
                            {program.temperatures.join(', ')}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Spin:</span>
                          <p className="text-slate-700 dark:text-slate-300">
                            {program.spinSpeeds.join(', ')} RPM
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Durasi:</span>
                          <p className="text-slate-700 dark:text-slate-300">{program.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

function getWashTypeEmoji(type: WashType): string {
  const emojiMap: Record<WashType, string> = {
    [WashType.Pakaian]: '👕',
    [WashType.Sepatu]: '👟',
    [WashType.Tas]: '👜',
    [WashType.Selimut]: '🛏️',
    [WashType.Boneka]: '🧸',
    [WashType.Karpet]: '🟫',
    [WashType.Gorden]: '🪟',
    [WashType.Lainnya]: '📦',
  };
  return emojiMap[type] || '📦';
}

export default WashSettingsModal;
