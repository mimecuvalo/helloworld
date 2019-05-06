import { ApolloProvider, getDataFromTree } from 'react-apollo';
import App from '../../client/app/App';
import createApolloClient from '../data/apollo_client';
import { DEFAULT_LOCALE, getLocale } from './locale';
import HTMLBase from './HTMLBase';
import { IntlProvider } from 'react-intl';
import JssProvider from 'react-jss/lib/JssProvider';
import * as languages from '../../shared/i18n/languages';
import { MuiThemeProvider, createMuiTheme, createGenerateClassName } from '@material-ui/core/styles';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SheetsRegistry } from 'jss';
import { StaticRouter } from 'react-router';
import uuid from 'uuid';

export default async function render({ req, res, next, assetPathsByType, appName, publicUrl, urls }) {
  const apolloClient = await createApolloClient(req);
  const context = {};
  const nonce = createNonceAndSetCSP(res);

  // Calculate an app version and time so that we can give our clients some kind of versioning scheme.
  // This lets us make sure that if there are bad / incompatible clients in the wild later on, we can
  // disable certain clients using their version number and making sure they're upgraded to the
  // latest, working version.
  //const execPromise = util.promisify(exec);

  // TODO(mime): need to rework this, causing problems on prod.
  const gitRev = 1; // (await execPromise('git rev-parse HEAD')).stdout.trim();
  const gitTime = 1; // (await execPromise('git log -1 --format=%cd --date=unix')).stdout.trim();

  const locale = getLocale(req);
  const translations = languages[locale];

  const FILTERED_KEYS = ['id', 'magic_key', 'private_key'];
  const filteredUser = req.session.user
    ? {
        oauth: req.session.user.oauth,
        model:
          req.session.user.model &&
          Object.keys(req.session.user.model)
            .filter(key => !FILTERED_KEYS.includes(key))
            .reduce((obj, key) => {
              obj[key] = req.session.user.model[key];
              return obj;
            }, {}),
      }
    : null;

  // For Material UI setup.
  const sheetsRegistry = new SheetsRegistry();
  const sheetsManager = new Map();
  const generateClassName = createGenerateClassName();
  const theme = createMuiTheme({
    typography: {
      useNextVariants: true,
    },
  });

  const coreApp = <App user={filteredUser} />;
  // We need to set leave out Material-UI classname generation when traversing the React tree for
  // react-apollo data. a) it speeds things up, but b) if we didn't do this, on prod, it can cause
  // classname hydration mismatches.
  const completeApp = isApolloTraversal => (
    <IntlProvider locale={locale} messages={translations}>
      <ApolloProvider client={apolloClient}>
        <HTMLBase
          apolloStateFn={() => apolloClient.extract()}
          appName={appName}
          appTime={gitTime}
          appVersion={gitRev}
          assetPathsByType={assetPathsByType}
          csrfToken={req.csrfToken()}
          defaultLocale={DEFAULT_LOCALE}
          locale={locale}
          nonce={nonce}
          publicUrl={publicUrl}
          req={req}
          urls={urls}
          user={filteredUser}
        >
          <StaticRouter location={req.url} context={context}>
            {!isApolloTraversal ? (
              <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
                <MuiThemeProvider theme={theme} sheetsManager={sheetsManager}>
                  {coreApp}
                </MuiThemeProvider>
              </JssProvider>
            ) : (
              coreApp
            )}
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

  const materialUICSS = sheetsRegistry.toString();

  /*
    XXX(mime): Material UI's server-side rendering for CSS doesn't allow for inserting CSS the same way we do
    Apollo's data (see apolloStateFn in HTMLBase). So for now, we just do a string replace, sigh.
    See related hacky code in server/app/HTMLHead.js
  */
  const renderedAppWithMaterialUICSS = renderedApp.replace(`<!--MATERIAL-UI-CSS-SSR-REPLACE-->`, materialUICSS);

  res.type('html');
  res.write('<!doctype html>');
  res.write(renderedAppWithMaterialUICSS);
  res.end();
}

function createNonceAndSetCSP(res) {
  // nonce is used in conjunction with a CSP policy to only execute scripts that have the correct nonce attribute.
  // see https://content-security-policy.com
  const nonce = uuid.v4();

  // If you wish to enable CSP, here's a sane policy to start with.
  // NOTE! this *won't* work with webpack currently!!!
  // TODO(mime): fix this. see https://webpack.js.org/guides/csp/
  // res.set('Content-Security-Policy',
  //     `upgrade-insecure-requests; ` +
  //     `default-src 'none'; ` +
  //     `script-src 'self' 'nonce-${nonce}'; ` +
  //     `style-src 'self' https://* 'nonce-${nonce}'; ` +
  //     `font-src 'self' https://*; ` +
  //     `connect-src 'self'; ` +
  //     `frame-ancestors 'self'; ` +
  //     `frame-src 'self' http://* https://*; ` +
  //     `media-src 'self' blob:; ` +
  //     `img-src https: http: data:; ` +
  //     `object-src 'self';`);

  return nonce;
}
