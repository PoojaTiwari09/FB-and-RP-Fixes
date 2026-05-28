import { useNavigate, useParams as useRouterParams, useLocation } from 'react-router-dom';

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  return useRouterParams() as T;
}

export function usePathname() {
  return useLocation().pathname;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
  };
}
