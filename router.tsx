import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { getGlobalStartContext } from '@tanstack/react-start';
import * as Sentry from '@sentry/tanstackstart-react';
import { routeTree } from './routeTree.gen';
import ErrorScreen from 'components/pages/ErrorScreen';
import NotFound from 'components/pages/NotFound';

export function getRouter() {
  const nonce =
    typeof window === 'undefined'
      ? (getGlobalStartContext() as unknown as { nonce?: string }).nonce
      : document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]')?.content;
  const router = createTanStackRouter({
    routeTree,
    ssr: { nonce },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultViewTransition: true,
    defaultErrorComponent: ErrorScreen,
    defaultNotFoundComponent: NotFound,
  });

  if (!router.isServer && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.addIntegration(Sentry.tanstackRouterBrowserTracingIntegration(router));
  }

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
