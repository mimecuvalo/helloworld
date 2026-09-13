import { Suspense, useSyncExternalStore, type ReactNode } from 'react';

const noopSubscribe = () => () => {};

// False on the server *and* during the client's hydration render — React uses
// `getServerSnapshot` for both — then true from the first post-mount render on.
export function useIsHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

// Gate for the client-only editors. `lazy()` alone isn't enough: the server
// resolves its stub synchronously and emits `fallback`, but on the client the
// chunk can finish loading before React gets around to hydrating the boundary,
// in which case hydration renders the real editor against the stub's markup and
// blows up the whole tree. Gating on hydration makes the first client render
// match the server byte for byte no matter who wins that race; the Suspense
// wrapper then covers the chunk load, which now happens after hydration.
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const isHydrated = useIsHydrated();
  if (!isHydrated) return <>{fallback}</>;

  return <Suspense fallback={fallback}>{children}</Suspense>;
}
