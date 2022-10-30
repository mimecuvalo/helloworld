import 'styles/globals.css';

import * as serviceWorkerRegistration from 'app/serviceWorkerRegistration';

import { APOLLO_STATE_PROP_NAME, useApollo } from 'app/apollo';
import { ApolloProvider, NormalizedCacheObject, gql } from '@apollo/client';
import { CacheProvider, EmotionCache } from '@emotion/react';
import { Footer, Header } from 'components';
import { IntlProvider, setupCreateIntl } from 'i18n';
import { createEmotionCache, muiTheme } from 'styles';
import { disposeAnalytics, setupAnalytics } from 'app/analytics';
import { useEffect, useState } from 'react';

import type { AppProps } from 'next/app';
import { CssBaseline } from '@mui/material';
import ErrorBoundary from 'components/error/ErrorBoundary';
import { F } from 'i18n';
import Head from 'next/head';
import { ThemeProvider } from '@mui/material';
import UserContext from 'app/UserContext';
import { UserPrivate } from 'data/graphql-generated';
import { UserProvider } from '@auth0/nextjs-auth0';
import clientHealthCheck from 'app/clientHealthCheck';
import { useRouter } from 'next/router';

export { reportWebVitals } from 'app/reportWebVitals';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export interface CustomAppProps extends AppProps {
  [APOLLO_STATE_PROP_NAME]: NormalizedCacheObject;
  emotionCache: EmotionCache;
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

function MyApp({ Component, emotionCache = clientSideEmotionCache, pageProps }: CustomAppProps) {
  const { locale = 'en', defaultLocale = 'en' } = useRouter();
  const apolloClient = useApollo(pageProps);
  const [currentUser, setCurrentUser] = useState<UserPrivate>();

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
  });

  useEffect(() => {
    async function loadUser() {
      const { data } = await apolloClient.query({
        query: CURRENT_USER_QUERY,
      });
      setCurrentUser(data.currentUser);
    }

    loadUser();
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
            <UserProvider>
              <UserContext.Provider value={{ user: currentUser }}>
                <ErrorBoundary>
                  <div className={process.env.NODE_ENV === 'development' ? 'App App-is-development' : 'App'}>
                    <Header />
                    <Head>
                      <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
                    </Head>
                    <Component {...pageProps} />
                    <Footer />
                  </div>
                </ErrorBoundary>
              </UserContext.Provider>
            </UserProvider>

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

export default MyApp;
