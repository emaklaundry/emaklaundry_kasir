import { describe, it, expect, vi } from 'vitest';

const calls: string[] = [];
let releaseFirst: () => void = () => {};

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn((_fn: string, args: { p_event: string }) => {
      calls.push(`start:${args.p_event}`);
      const done = () => {
        calls.push(`end:${args.p_event}`);
        return { error: null };
      };
      if (args.p_event === 'activity') {
        return new Promise((resolve) => {
          releaseFirst = () => resolve(done());
        });
      }
      return Promise.resolve(done());
    }),
  },
}));

import { recordAttendance } from '@/utils/attendanceTracker';

describe('recordAttendance', () => {
  it("mengirim 'logout' setelah 'activity' sebelumnya selesai", async () => {
    const first = recordAttendance('activity');
    const second = recordAttendance('logout');
    await Promise.resolve();
    expect(calls).toEqual(['start:activity']);
    releaseFirst();
    await Promise.all([first, second]);
    expect(calls).toEqual(['start:activity', 'end:activity', 'start:logout', 'end:logout']);
  });
});
