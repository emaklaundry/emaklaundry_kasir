/* Minimal type shims to help the editor resolve types while workspace TypeScript is configured.
   These are intentionally permissive (any) and meant as a temporary mitigation. 
   If you'd like, we can replace them with stricter typings later.
*/

declare module 'react-router' {
  // Minimal hooks used in the project
  export function useParams<T = Record<string, string | undefined>>(): T;
  export function useNavigate(): (...args: unknown[]) => unknown;
  export function useLocation(): unknown;
  export function useRoutes(...args: unknown[]): unknown;
  export function useHref(...args: unknown[]): unknown;
}

declare module 'react-router-dom' {
  import * as React from 'react';
  export const Link: React.ComponentType<unknown>;
  export function useParams<T = Record<string, string | undefined>>(): T;
  export function useNavigate(): (...args: unknown[]) => unknown;
  export function useLocation(): unknown;
  export function useHref(...args: unknown[]): unknown;
  export default React;
}

declare module '@tanstack/react-query' {
  export const useQuery: unknown;
  export const useMutation: unknown;
  export const useQueryClient: unknown;
  export const QueryClient: unknown;
  export const QueryClientProvider: unknown;
  const __default: unknown;
  export default __default;
}
