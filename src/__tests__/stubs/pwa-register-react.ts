// Test stand-in for the build-time virtual module `virtual:pwa-register/react` (provided by
// vite-plugin-pwa, which is not loaded under Vitest). Tests override it with vi.mock.
export const useRegisterSW = () => ({
  needRefresh: [false, () => undefined] as [boolean, (value: boolean) => void],
  offlineReady: [false, () => undefined] as [boolean, (value: boolean) => void],
  updateServiceWorker: async () => undefined,
});
