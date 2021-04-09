import * as languages from 'shared/i18n-lang-packs';

import { IntlProvider, getDefaultLocale, getLocaleFromRequest, getLocales, setLocales } from 'react-intl-wrapper';
import { JssProvider, SheetsRegistry } from 'react-jss';
import { ServerStyleSheets, ThemeProvider } from '@material-ui/core/styles';

import { ApolloProvider } from '@apollo/client';
import App from 'client/app/App';
import HTMLBase from './HTMLBase';
import { StaticRouter } from 'react-router';
import createApolloClient from 'server/data/apollo_client';
import { getDataFromTree } from '@apollo/client/react/ssr';
import getExperiments from './experiments';
import { initializeLocalState } from 'shared/data/local_state';
import murmurhash from 'murmurhash';
import { renderToString } from 'react-dom/server';
import theme from 'shared/theme';

setLocales({
  defaultLocale: process.env.DEFAULT_LOCALE || 'en',
  locales: process.env.LOCALES ? process.env.LOCALES.split(',') : ['en'],
});

export default async function render({ req, res, next, assetPathsByType, appName, nonce, publicUrl, gitInfo }) {
  const FILTERED_KEYS = ['id', 'private_key'];
  const filteredUser = req.session.user
    ? {
        oauth: req.session.user.oauth,
        model:
          req.session.user.model &&
          Object.keys(req.session.user.model)
            .filter((key) => !FILTERED_KEYS.includes(key))
            .reduce((obj, key) => {
              obj[key] = req.session.user.model[key];
              return obj;
            }, {}),
      }
    : null;
  const experiments = getExperiments(req);
  initializeLocalState(filteredUser, experiments);

  const apolloClient = createApolloClient(req);
  const context = {};

  const locale = getLocaleFromRequest(req);
  const translations = languages[locale];

  // For Material UI setup.
  const sheets = new ServerStyleSheets();
  const sheetsNonMaterialUI = new SheetsRegistry();

  // XXX(mime): if we don't manually set generateClassName we get SSR/client mismatch upon
  // hydration. See example: https://github.com/cssinjs/jss/issues/926
  // I don't know wtf and have messed around with this for hours and hours.
  // This works enough for now.
  // Material v5 is migrating away from jss -> emotion and this might be fixed in v5.
  const createGenerateClassName = () => (rule) => murmurhash.v3(rule.toString()).toString();
  const generateId = createGenerateClassName();

  const coreApp = <App user={filteredUser} />;
  // We need to set leave out Material-UI classname generation when traversing the React tree for
  // Apollo data. a) it speeds things up, but b) if we didn't do this, on prod, it can cause
  // classname hydration mismatches.
  const completeApp = (isApolloTraversal) => (
    <IntlProvider defaultLocale={locale} locale={locale} messages={translations}>
      <ApolloProvider client={apolloClient}>
        <HTMLBase
          apolloStateFn={() => apolloClient.extract()}
          appName={appName}
          appTime={gitInfo.gitTime}
          appVersion={gitInfo.gitRev}
          assetPathsByType={assetPathsByType}
          csrfToken={req.csrfToken()}
          defaultLocale={getDefaultLocale()}
          experiments={experiments}
          locale={locale}
          locales={getLocales()}
          nonce={nonce}
          publicUrl={publicUrl}
          req={req}
          user={filteredUser}
        >
          <StaticRouter location={req.url} context={context}>
            {!isApolloTraversal
              ? sheets.collect(
                  <JssProvider registry={sheetsNonMaterialUI} generateId={generateId}>
                    <ThemeProvider theme={theme}>{coreApp}</ThemeProvider>
                  </JssProvider>
                )
              : coreApp}
          </StaticRouter>
        </HTMLBase>
      </ApolloProvider>
    </IntlProvider>
  );

  // This is so we can do `apolloClient.extract()` later on.
  try {
    await getDataFromTree(completeApp(true /* isApolloTraversal */));
  } catch (ex) {
    next(ex);
    return;
  }

  const renderedApp = renderToString(completeApp(false /* isApolloTraversal */));
  if (context.url) {
    res.redirect(301, context.url);
    return;
  }

  const materialUICSS = sheets.toString();
  const nonMaterialCSS = sheetsNonMaterialUI.toString();

  /*
    XXX(mime): Server-side rendering for CSS doesn't allow for inserting CSS the same way we do
    Apollo's data (see apolloStateFn in HTMLBase). So for now, we just do a string replace, sigh.
    See related hacky code in server/app/HTMLHead.js
  */
  const renderedAppWithCSS = renderedApp.replace(`<!--CSS-SSR-REPLACE-->`, materialUICSS + '\n' + nonMaterialCSS);

  res.type('html');
  res.write('<!doctype html>');
  res.write(renderedAppWithCSS);
  res.end();
}
