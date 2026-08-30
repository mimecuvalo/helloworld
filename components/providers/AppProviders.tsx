import { type ReactNode, useState } from 'react';
import type { IntlConfig } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider, setupCreateIntl } from 'i18n';
import { makeQueryClient } from 'lib/query';

interface AppProvidersProps {
  locale?: string;
  defaultLocale?: string;
  messages: Record<string, unknown>;
  children: ReactNode;
}

export default function AppProviders({ locale = 'en', defaultLocale = 'en', messages, children }: AppProvidersProps) {
  const [queryClient] = useState(makeQueryClient);

  const intlMessages = messages as IntlConfig['messages'];

  setupCreateIntl({ defaultLocale, locale, messages: intlMessages });

  return (
    // `timeZone` is pinned so dates format identically on the server (which runs in UTC) and in
    // the browser, whatever zone the visitor is in. Without it, a post published late in the UTC
    // day renders a different date on each side and React bails out of hydration.
    <IntlProvider defaultLocale={defaultLocale} locale={locale} messages={intlMessages} timeZone="UTC">
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </IntlProvider>
  );
}
