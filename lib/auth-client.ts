import { useQuery } from '@tanstack/react-query';
import type { Session } from '@auth/core/types';

async function fetchSession(): Promise<Session | null> {
  const res = await fetch('/api/auth/session');
  if (!res.ok) return null;
  const data = (await res.json()) as Session | Record<string, never>;
  return data && Object.keys(data).length > 0 ? (data as Session) : null;
}

export function useSession() {
  const { data, isLoading } = useQuery({
    queryKey: ['auth-session'],
    queryFn: fetchSession,
    staleTime: 5 * 60_000,
  });
  return { session: data ?? null, isLoading };
}

export function signIn(): void {
  window.location.href = '/api/auth/signin';
}

export function signOut(): void {
  window.location.href = '/api/auth/signout';
}
