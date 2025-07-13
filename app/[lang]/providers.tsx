'use client';

import { ReactNode, useEffect, useState } from 'react';
import * as serviceWorkerRegistration from '@/application/serviceWorkerRegistration';
import { useApollo } from '@/application/apollo';
import { ApolloProvider } from '@apollo/client';
import { DebugWrapper, Header } from 'components';
import { IntlProvider, setupCreateIntl } from 'i18n';
import { disposeAnalytics, setupAnalytics } from '@/application/analytics';
import { Analytics } from '@vercel/analytics/react';
import { CssBaseline } from '@mui/material';
import ErrorBoundary from 'components/error/ErrorBoundary';
import { F } from 'i18n';
import { Inter, Oswald, Noto_Color_Emoji } from 'next/font/google';
import classNames from 'classnames';
import clientHealthCheck from '@/application/clientHealthCheck';
import { trackWebVitals } from '@/application/reportWebVitals';
import { useReportWebVitals } from 'next/web-vitals';
import ThemeRegistry from './theme-registry';

// Import compiled messages
import translationsEnJson from '../../public/i18n-compiled-lang/en.json';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoColorEmoji = Noto_Color_Emoji({ subsets: ['emoji'], weight: '400', variable: '--noto-color-emoji' });

// If loading a variable font, you don't need to specify the font weight
const oswald = Oswald({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
});

export default function Providers({ children, lang }: { children: ReactNode; nonce: string; lang: string }) {
  useReportWebVitals(trackWebVitals);

  const [messages, setMessages] = useState<any>(translationsEnJson);

  useEffect(() => {
    // Upon starting the app, kick off a client health check which runs periodically.
    clientHealthCheck();

    setupAnalytics();

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://cra.link/PWA
    serviceWorkerRegistration.unregister();

    // TODO(mime)
    // window.configuration = {
    //   experiments: getExperiments(user),
    // };
    // initializeLocalState(window.configuration.experiments);

    return () => {
      disposeAnalytics();
    };
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      if (lang === 'en') {
        setMessages(translationsEnJson);
        return;
      }

      try {
        const res = await fetch(`/i18n-compiled-lang/${lang}.json`);
        const messages = await res.json();
        setMessages(messages);
      } catch (error) {
        console.error('Failed to load messages for locale:', lang, error);
        setMessages(translationsEnJson); // Fallback to English
      }
    }
    fetchMessages();
  }, [lang]);

  // Apollo client needs to be initialized per-page in app router
  const apolloClient = useApollo({});

  // Use the actual compiled messages instead of empty object
  setupCreateIntl({ defaultLocale: 'en', locale: lang, messages });

  return (
    <IntlProvider defaultLocale="en" locale={lang} messages={messages}>
      <ApolloProvider client={apolloClient}>
        <ThemeRegistry options={{ key: 'css', prepend: true }}>
          <CssBaseline />
          <style jsx global>{`
            :root {
              --font-oswald: ${oswald.style.fontFamily};
              --font-inter: ${inter.style.fontFamily};
              --font-noto-color-emoji: ${notoColorEmoji.style.fontFamily};
            }
          `}</style>
          <ErrorBoundary>
            <div
              className={classNames({
                'App-logged-in': true,
                'App-is-development': process.env.NODE_ENV === 'development',
              })}
            >
              <Header />
              {children}
              <Analytics />
              <DebugWrapper />
            </div>
          </ErrorBoundary>

          <noscript>
            <F defaultMessage="You need to enable JavaScript to run this app." />
          </noscript>
        </ThemeRegistry>
      </ApolloProvider>
    </IntlProvider>
  );
}
