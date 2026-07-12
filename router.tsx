import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import * as Sentry from '@sentry/tanstackstart-react';
import { routeTree } from './routeTree.gen';
import ErrorScreen from 'components/pages/ErrorScreen';
import NotFound from 'components/pages/NotFound';

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
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
