import type { ReactNode } from 'react';
import { Outlet, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import 'sanitize.css/sanitize.css';
import 'sanitize.css/forms.css';
import 'sanitize.css/typography.css';
import '@fontsource-variable/oswald';
import '@fontsource/marck-script';
import '@fontsource/press-start-2p';
import 'styles/globals.css';
import AppProviders from 'components/providers/AppProviders';
import DebugWrapper from 'components/internal/DebugWrapper';
import Header from 'components/Header';
import NotFound from 'components/pages/NotFound';
import ErrorScreen from 'components/pages/ErrorScreen';
import { getMessages } from 'lib/messages';
import { initRequest } from 'lib/request-init';

export const Route = createRootRoute({
  // Runs server-side on initial load: sets security headers + resolves locale.
  loader: async () => {
    const { locale } = await initRequest();
    return { locale, messages: getMessages(locale) };
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'minimum-scale=1, initial-scale=1, width=device-width' },
      { title: 'hello, world.' },
      { name: 'description', content: 'a federated blog with feed reader.' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorScreen,
});

function RootComponent() {
  const { locale, messages } = Route.useLoaderData();
  return (
    <RootDocument locale={locale}>
      <AppProviders locale={locale} messages={messages}>
        <Header />
        <Outlet />
        <DebugWrapper />
      </AppProviders>
    </RootDocument>
  );
}

function RootDocument({ locale, children }: { locale: string; children: ReactNode }) {
  return (
    <html lang={locale}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
