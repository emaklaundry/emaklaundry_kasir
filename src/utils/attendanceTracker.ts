import { supabase } from './supabaseClient';

/**
 * Absensi otomatis dari login karyawan.
 * - 'activity': aktivitas pertama hari itu = jam masuk; setiap aktivitas memperbarui
 *   "aktivitas terakhir", yang dipakai sebagai jam pulang bila karyawan tidak menekan Keluar.
 * - 'logout': karyawan menekan Keluar = jam pulang.
 * Server hanya mencatat untuk akun milik karyawan aktif; akun lain diabaikan.
 */
export type AttendanceEvent = 'activity' | 'logout';

/** Jeda minimum antar pencatatan aktivitas (akurasi jam pulang otomatis). */
export const ATTENDANCE_PING_INTERVAL_MS = 2 * 60 * 1000;

/** Event yang dianggap karyawan benar-benar sedang memakai aplikasi. */
export const ATTENDANCE_ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

const send = async (event: AttendanceEvent): Promise<void> => {
  try {
    const { error } = await supabase.rpc('record_attendance', { p_event: event });
    if (error) console.warn('Absensi otomatis gagal dicatat:', error.message);
  } catch (error) {
    // Absensi tidak boleh mengganggu pekerjaan kasir; cukup dicatat di konsol.
    console.warn('Absensi otomatis gagal dicatat:', error);
  }
};

// Dikirim berurutan: sentuhan pada tombol Keluar memicu 'activity' tepat sebelum 'logout'.
// Bila 'activity' tiba belakangan, server akan membuka lagi jam pulang yang baru dicatat.
let queue: Promise<void> = Promise.resolve();

export const recordAttendance = (event: AttendanceEvent): Promise<void> => {
  queue = queue.then(() => send(event));
  return queue;
};
