import { ApolloProvider, getDataFromTree } from 'react-apollo';
import App from '../../client/app/App';
import createApolloClient from '../data/apollo_client';
import { DEFAULT_LOCALE, getLocale } from './locale';
import HTMLBase from './HTMLBase';
import { IntlProvider } from 'react-intl';
import * as languages from '../../shared/i18n/languages';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheets, ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { StaticRouter } from 'react-router';
import uuid from 'uuid';

export default async function render({ req, res, next, assetPathsByType, appName, publicUrl, gitInfo }) {
  const apolloClient = createApolloClient(req);
  const context = {};
  const nonce = createNonceAndSetCSP(res);

  const locale = getLocale(req);
  const translations = languages[locale];

  const FILTERED_KEYS = ['id', 'private_key'];
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
  const sheets = new ServerStyleSheets();
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
          appTime={gitInfo.gitTime}
          appVersion={gitInfo.gitRev}
          assetPathsByType={assetPathsByType}
          csrfToken={req.csrfToken()}
          defaultLocale={DEFAULT_LOCALE}
          locale={locale}
          nonce={nonce}
          publicUrl={publicUrl}
          req={req}
          user={filteredUser}
        >
          <StaticRouter location={req.url} context={context}>
            {!isApolloTraversal ? sheets.collect(<ThemeProvider theme={theme}>{coreApp}</ThemeProvider>) : coreApp}
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
