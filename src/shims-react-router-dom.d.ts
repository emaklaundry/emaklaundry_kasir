declare module 'react-router-dom' {
  // Minimal shims to satisfy TypeScript for this workspace when router typings mismatch
  export const HashRouter: any;
  export const Routes: any;
  export const Route: any;
  export const Navigate: any;
  export const Link: any;
  export const NavLink: any;
  export function useParams<T = Record<string, string>>(): T;
  export function useSearchParams(): [URLSearchParams, (p: URLSearchParams) => void];
  export function useNavigate(): (to: string | number, options?: any) => void;
  export function useLocation(): any;
  const _default: any;
  export default _default;
}
