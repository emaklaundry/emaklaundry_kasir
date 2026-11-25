import { WashType } from '@/types';

export interface WashingMachine {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  capacity: number; // kg
  type: 'front-load' | 'top-load';
  programs: WashProgram[];
}

export interface WashProgram {
  name: string;
  nameId: string; // Indonesian name
  temperatures: string[];
  spinSpeeds: number[];
  duration: string; // approximate
}

export interface WashRecommendation {
  washType: WashType;
  machineId: string;
  program: string;
  temperature: string;
  spinSpeed: number;
  maxLoad: number; // kg
  detergentAmount: string;
  notes?: string;
  tips?: string[];
}

// Data mesin cuci yang tersedia di laundry
export const washingMachines: WashingMachine[] = [
  {
    id: 'ewf9025',
    name: 'Electrolux EWF9025BQWA',
    model: 'EWF9025BQWA',
    serialNumber: 'FLT092441',
    capacity: 9,
    type: 'front-load',
    programs: [
      {
        name: 'Cotton',
        nameId: 'Katun',
        temperatures: ['Cold', '30°C', '40°C', '60°C', '90°C'],
        spinSpeeds: [400, 800, 1000, 1200],
        duration: '~60-120 menit',
      },
      {
        name: 'Synthetics',
        nameId: 'Sintetis',
        temperatures: ['Cold', '30°C', '40°C', '60°C'],
        spinSpeeds: [400, 800, 1000],
        duration: '~50-90 menit',
      },
      {
        name: 'Delicates',
        nameId: 'Halus',
        temperatures: ['Cold', '30°C', '40°C'],
        spinSpeeds: [400, 800],
        duration: '~40-60 menit',
      },
      {
        name: 'Wool',
        nameId: 'Wol',
        temperatures: ['Cold', '30°C'],
        spinSpeeds: [400, 800],
        duration: '~50-70 menit',
      },
      {
        name: 'Quick Wash',
        nameId: 'Cuci Cepat',
        temperatures: ['Cold', '30°C', '40°C'],
        spinSpeeds: [800, 1000, 1200],
        duration: '~15-30 menit',
      },
      {
        name: 'Bedding',
        nameId: 'Sprei/Selimut',
        temperatures: ['30°C', '40°C', '60°C'],
        spinSpeeds: [400, 800, 1000],
        duration: '~80-120 menit',
      },
    ],
  },
  {
    id: 'ewf12845',
    name: 'Electrolux EWF12845',
    model: 'EWF12845',
    serialNumber: 'FLT542141',
    capacity: 12,
    type: 'front-load',
    programs: [
      {
        name: 'Cotton',
        nameId: 'Katun',
        temperatures: ['Cold', '30°C', '40°C', '60°C', '90°C'],
        spinSpeeds: [400, 800, 1000, 1200, 1400],
        duration: '~60-120 menit',
      },
      {
        name: 'Synthetics',
        nameId: 'Sintetis',
        temperatures: ['Cold', '30°C', '40°C', '60°C'],
        spinSpeeds: [400, 800, 1000],
        duration: '~50-90 menit',
      },
      {
        name: 'Delicates',
        nameId: 'Halus',
        temperatures: ['Cold', '30°C', '40°C'],
        spinSpeeds: [400, 800],
        duration: '~40-60 menit',
      },
      {
        name: 'Heavy Duty',
        nameId: 'Berat/Kotor',
        temperatures: ['40°C', '60°C', '90°C'],
        spinSpeeds: [800, 1000, 1200, 1400],
        duration: '~90-150 menit',
      },
      {
        name: 'Bedding',
        nameId: 'Sprei/Selimut',
        temperatures: ['30°C', '40°C', '60°C'],
        spinSpeeds: [400, 800, 1000],
        duration: '~80-120 menit',
      },
      {
        name: 'Bulky Items',
        nameId: 'Barang Besar',
        temperatures: ['30°C', '40°C'],
        spinSpeeds: [400, 800],
        duration: '~70-100 menit',
      },
    ],
  },
];

// Rekomendasi setting berdasarkan jenis cucian
export const washRecommendations: WashRecommendation[] = [
  // Pakaian biasa
  {
    washType: WashType.Pakaian,
    machineId: 'ewf9025',
    program: 'Cotton',
    temperature: '40°C',
    spinSpeed: 1000,
    maxLoad: 9,
    detergentAmount: '40-50ml',
    notes: 'Untuk pakaian sehari-hari dengan kotoran normal',
    tips: [
      'Pisahkan pakaian berwarna terang dan gelap',
      'Kancing dan ritsleting harus ditutup',
      'Kantong harus dikosongkan',
    ],
  },
  {
    washType: WashType.Pakaian,
    machineId: 'ewf12845',
    program: 'Cotton',
    temperature: '40°C',
    spinSpeed: 1000,
    maxLoad: 12,
    detergentAmount: '50-60ml',
    notes: 'Untuk pakaian sehari-hari dengan kotoran normal (kapasitas besar)',
    tips: [
      'Pisahkan pakaian berwarna terang dan gelap',
      'Kancing dan ritsleting harus ditutup',
      'Kantong harus dikosongkan',
    ],
  },

  // Sepatu
  {
    washType: WashType.Sepatu,
    machineId: 'ewf9025',
    program: 'Delicates',
    temperature: '30°C',
    spinSpeed: 400,
    maxLoad: 2, // 2-3 pasang
    detergentAmount: '20-30ml',
    notes: 'Gunakan kantong laundry untuk sepatu',
    tips: [
      'Lepas tali sepatu dan cuci terpisah',
      'Masukkan sepatu ke dalam kantong laundry mesh',
      'Jangan cuci lebih dari 2-3 pasang sekaligus',
      'Keringkan di tempat teduh, hindari sinar matahari langsung',
    ],
  },

  // Tas
  {
    washType: WashType.Tas,
    machineId: 'ewf9025',
    program: 'Delicates',
    temperature: '30°C',
    spinSpeed: 400,
    maxLoad: 3,
    detergentAmount: '20-30ml',
    notes: 'Hanya untuk tas kain/kanvas. Tas kulit TIDAK boleh dicuci mesin.',
    tips: [
      'Kosongkan semua kantong tas',
      'Lepas tali/strap yang bisa dilepas',
      'Balikkan tas (bagian dalam ke luar)',
      'Masukkan ke kantong laundry',
    ],
  },

  // Selimut
  {
    washType: WashType.Selimut,
    machineId: 'ewf12845', // Gunakan mesin kapasitas besar
    program: 'Bedding',
    temperature: '40°C',
    spinSpeed: 800,
    maxLoad: 3, // 2-3 selimut single
    detergentAmount: '50-60ml',
    notes: 'Gunakan mesin 12kg untuk selimut ukuran besar',
    tips: [
      'Satu selimut king size = 1 load',
      'Jangan isi terlalu penuh agar hasil maksimal',
      'Untuk selimut bulu, gunakan suhu dingin',
      'Keringkan dengan tumble dry low atau angin-anginkan',
    ],
  },
  {
    washType: WashType.Selimut,
    machineId: 'ewf9025',
    program: 'Bedding',
    temperature: '40°C',
    spinSpeed: 800,
    maxLoad: 2,
    detergentAmount: '40-50ml',
    notes: 'Untuk selimut ukuran single/kecil',
    tips: ['Maksimal 2 selimut single per load', 'Jangan isi terlalu penuh'],
  },

  // Boneka
  {
    washType: WashType.Boneka,
    machineId: 'ewf9025',
    program: 'Delicates',
    temperature: '30°C',
    spinSpeed: 400,
    maxLoad: 5,
    detergentAmount: '20-30ml',
    notes: 'Untuk boneka berbahan kain/polyester. Cek label perawatan terlebih dahulu.',
    tips: [
      'Masukkan boneka ke dalam sarung bantal/kantong laundry',
      'Lepas aksesoris yang bisa dilepas',
      'Untuk boneka dengan baterai, JANGAN cuci mesin',
      'Keringkan dengan diangin-anginkan, jangan dijemur langsung',
    ],
  },

  // Karpet
  {
    washType: WashType.Karpet,
    machineId: 'ewf12845',
    program: 'Heavy Duty',
    temperature: '40°C',
    spinSpeed: 1000,
    maxLoad: 5,
    detergentAmount: '60-70ml',
    notes: 'Untuk karpet kecil-sedang. Karpet besar harus dicuci terpisah.',
    tips: [
      'Vakum karpet terlebih dahulu untuk menghilangkan debu',
      'Kocok untuk menghilangkan kotoran kering',
      'Jangan lipat karpet dengan karet backing',
      'Jemur di tempat teduh untuk mencegah warna pudar',
    ],
  },

  // Gorden
  {
    washType: WashType.Gorden,
    machineId: 'ewf12845',
    program: 'Delicates',
    temperature: '30°C',
    spinSpeed: 400,
    maxLoad: 4,
    detergentAmount: '40-50ml',
    notes: 'Untuk gorden berbahan polyester/katun ringan',
    tips: [
      'Lepas semua kait dan ring',
      'Lipat gorden dengan rapi sebelum dimasukkan',
      'Jangan peras, langsung jemur basah',
      'Setrika dalam keadaan sedikit lembab',
    ],
  },

  // Lainnya
  {
    washType: WashType.Lainnya,
    machineId: 'ewf9025',
    program: 'Synthetics',
    temperature: '30°C',
    spinSpeed: 800,
    maxLoad: 5,
    detergentAmount: '30-40ml',
    notes: 'Setting default untuk item lainnya. Sesuaikan berdasarkan jenis bahan.',
    tips: [
      'Selalu cek label perawatan',
      'Jika ragu, gunakan suhu dingin',
      'Gunakan kantong laundry untuk item sensitif',
    ],
  },
];

// Helper function untuk mendapatkan rekomendasi berdasarkan WashType
export function getRecommendationsByWashType(washType: WashType): WashRecommendation[] {
  return washRecommendations.filter((rec) => rec.washType === washType);
}

// Helper function untuk mendapatkan mesin berdasarkan ID
export function getMachineById(machineId: string): WashingMachine | undefined {
  return washingMachines.find((m) => m.id === machineId);
}

// Helper function untuk mendapatkan rekomendasi terbaik (mesin dengan kapasitas sesuai)
export function getBestRecommendation(
  washType: WashType,
  estimatedWeight?: number,
): WashRecommendation | undefined {
  const recs = getRecommendationsByWashType(washType);
  if (recs.length === 0) return undefined;

  if (estimatedWeight) {
    // Pilih mesin dengan kapasitas yang cukup tapi tidak terlalu besar
    const suitable = recs.find((r) => r.maxLoad >= estimatedWeight);
    return suitable || recs[recs.length - 1]; // fallback ke yang terbesar
  }

  return recs[0]; // default ke rekomendasi pertama
}
