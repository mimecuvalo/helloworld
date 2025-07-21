import 'styles/globals.css';

import * as serviceWorkerRegistration from '@/application/serviceWorkerRegistration';

import { APOLLO_STATE_PROP_NAME, useApollo } from '@/application/apollo';
import { ApolloClient, ApolloProvider, NormalizedCacheObject, gql } from '@apollo/client';
import { CacheProvider, EmotionCache } from '@emotion/react';
import { DebugWrapper, Header } from 'components';
import { IntlProvider, setupCreateIntl } from 'i18n';
import { Marck_Script, Press_Start_2P, Noto_Color_Emoji } from 'next/font/google';
import { createEmotionCache, muiTheme } from 'styles';
import { disposeAnalytics, setupAnalytics } from '@/application/analytics';
import { useEffect, useState } from 'react';

import { Analytics } from '@vercel/analytics/react';
import type { AppProps } from 'next/app';
import { CssBaseline } from '@mui/material';
import ErrorBoundary from 'components/error/ErrorBoundary';
import { F } from 'i18n';
import Head from 'next/head';
import { ThemeProvider } from '@mui/material/styles';
import UserContext from '@/application/UserContext';
import { UserPrivate } from 'data/graphql-generated';
import { useRouter } from 'next/router';
import { trackWebVitals } from '@/application/reportWebVitals';
import { useReportWebVitals } from 'next/web-vitals';
import { SessionProvider, useSession } from 'next-auth/react';

// If loading a variable font, you don't need to specify the font weight
const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start-2p',
  display: 'swap',
});
const notoColorEmoji = Noto_Color_Emoji({ subsets: ['emoji'], weight: '400', variable: '--noto-color-emoji' });
const marckScript = Marck_Script({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marck-script',
  display: 'swap',
});

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export interface CustomAppProps extends AppProps {
  [APOLLO_STATE_PROP_NAME]: NormalizedCacheObject;
  emotionCache: EmotionCache;
  nonce: string;
}

const CURRENT_USER_QUERY = gql`
  query CurrentUser {
    currentUser {
      id
      username
      name
      email
      theme
      title
      favicon
    }
  }
`;

function CustomUserProvider({
  apolloClient,
  children,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>;
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<UserPrivate>();
  const { data: session } = useSession();

  useEffect(() => {
    async function loadUser() {
      if (session?.user?.email) {
        const { data } = await apolloClient.query({
          query: CURRENT_USER_QUERY,
        });
        setCurrentUser(data.currentUser);
      }
    }

    loadUser();
  }, [apolloClient, session]);

  return <UserContext value={{ user: currentUser }}>{children}</UserContext>;
}

function HelloWorldApp({ Component, emotionCache = clientSideEmotionCache, pageProps }: CustomAppProps) {
  const { locale = 'en', defaultLocale = 'en' } = useRouter();
  const apolloClient = useApollo(pageProps);
  useReportWebVitals(trackWebVitals);

  useEffect(() => {
    // Upon starting the app, kick off a client health check which runs periodically.
    // TODO disabled
    // clientHealthCheck();

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
  });

  const messages = pageProps.intlMessages || {};
  // createIntl is used in non-React locations.
  setupCreateIntl({ defaultLocale, locale, messages });

  return (
    // @ts-ignore looks like IntlProvider still needs updated types after React 18 transition.
    <IntlProvider defaultLocale={locale} locale={locale} messages={messages}>
      <ApolloProvider client={apolloClient}>
        <CacheProvider value={emotionCache}>
          <ThemeProvider theme={muiTheme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            <SessionProvider session={pageProps.session}>
              <CustomUserProvider apolloClient={apolloClient}>
                <ErrorBoundary>
                  <style jsx global>{`
                    :root {
                      --font-noto-color-emoji: ${notoColorEmoji.style.fontFamily};
                      --font-press-start-2p: ${pressStart2P.style.fontFamily};
                      --font-marck-script: ${marckScript.style.fontFamily};
                    }
                  `}</style>
                  <div
                    className={
                      (process.env.NODE_ENV === 'development' ? 'App App-is-development' : 'App') +
                      ` ${pressStart2P.variable} ${marckScript.variable} ${notoColorEmoji.variable}`
                    }
                  >
                    <Header />
                    <Head>
                      <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
                    </Head>
                    <Component {...pageProps} />
                    <Analytics />
                    <DebugWrapper />
                  </div>
                </ErrorBoundary>
              </CustomUserProvider>
            </SessionProvider>

            <noscript>
              <F defaultMessage="You need to enable JavaScript to run this app." />
            </noscript>
            <div
              dangerouslySetInnerHTML={{
                __html: `<!--
                  this is the way the web ends
                  this is the way the web ends
                  this is the way the web ends
                  not with a bang but with a OMGWTFBBQ

                  designed in Croatia by:
                     _  *  _  |_ -|- | *  _  |_ -|-
                    | | | |_| | | |  | | |_| | | |
                          _|             _|
                -->`,
              }}
            />
          </ThemeProvider>
        </CacheProvider>
      </ApolloProvider>
    </IntlProvider>
  );
}

export default HelloWorldApp;
