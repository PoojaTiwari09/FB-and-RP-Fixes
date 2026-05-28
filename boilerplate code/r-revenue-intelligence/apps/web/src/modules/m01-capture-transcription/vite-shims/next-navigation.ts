import { useNavigate, useParams as useRouterParams } from 'react-router-dom';

export function useParams<T extends Record<string, string>>() {
  return useRouterParams() as T;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
  };
}
