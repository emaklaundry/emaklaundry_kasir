/* Minimal type shims to help the editor resolve types while workspace TypeScript is configured.
   These are intentionally permissive (any) and meant as a temporary mitigation. 
   If you'd like, we can replace them with stricter typings later.
*/

declare module 'react-router' {
  // Minimal hooks used in the project
  export function useParams<T = Record<string, string | undefined>>(): T;
  export function useNavigate(): (...args: any[]) => any;
  export function useLocation(): any;
  export function useRoutes(...args: any[]): any;
  export function useHref(...args: any[]): any;
}

declare module 'react-router-dom' {
  import * as React from 'react';
  export const Link: React.ComponentType<any>;
  export function useParams<T = Record<string, string | undefined>>(): T;
  export function useNavigate(): (...args: any[]) => any;
  export function useLocation(): any;
  export function useHref(...args: any[]): any;
  export default React;
}

declare module '@tanstack/react-query' {
  export const useQuery: any;
  export const useMutation: any;
  export const useQueryClient: any;
  export const QueryClient: any;
  export const QueryClientProvider: any;
  const __default: any;
  export default __default;
}
