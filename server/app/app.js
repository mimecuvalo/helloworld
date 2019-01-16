import { ApolloProvider, getDataFromTree } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import App from '../../client/app/App';
import { exec } from 'child_process';
import { DEFAULT_LOCALE, getLocale } from './locale';
import fetch from 'node-fetch';
import HTMLBase from './HTMLBase';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { IntlProvider } from 'react-intl';
import * as languages from '../../shared/i18n/languages';
import React from 'react';
import { renderToNodeStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import util from 'util';
import uuid from 'uuid';

export default async function render({ req, res, assetPathsByType, appName, publicUrl, urls }) {
  const apolloClient = await createApolloClient(req);
  const context = {};
  const nonce = createNonceAndSetCSP(res);

  // Calculate an app version and time so that we can give our clients some kind of versioning scheme.
  // This lets us make sure that if there are bad / incompatible clients in the wild later on, we can
  // disable certain clients using their version number and making sure they're upgraded to the
  // latest, working version.
  const execPromise = util.promisify(exec);
  const gitRev = (await execPromise('git rev-parse HEAD')).stdout.trim();
  const gitTime = (await execPromise('git log -1 --format=%cd --date=unix')).stdout.trim();

  const locale = getLocale(req);
  const translations = languages[locale];

  const completeApp = (
    <IntlProvider locale={locale} messages={translations}>
      <HTMLBase
        apolloStateFn={() => apolloClient.extract()}
        appTime={gitTime}
        appVersion={gitRev}
        assetPathsByType={assetPathsByType}
        csrfToken={req.csrfToken()}
        defaultLocale={DEFAULT_LOCALE}
        locale={locale}
        nonce={nonce}
        publicUrl={publicUrl}
        title={appName}
        urls={urls}
        user={req.session.user}
      >
        <ApolloProvider client={apolloClient}>
          <StaticRouter location={req.url} context={context}>
            <App user={req.session.user} />
          </StaticRouter>
        </ApolloProvider>
      </HTMLBase>
    </IntlProvider>
  );

  // This is so we can do `apolloClient.extract()` later on.
  await getDataFromTree(completeApp);

  res.write('<!doctype html>');
  const stream = renderToNodeStream(completeApp);
  stream.pipe(res);

  if (context.url) {
    res.redirect(301, context.url);
    return;
  }
}

// We create an Apollo client here on the server so that we can get server-side rendering in properly.
async function createApolloClient(req) {
  const hostWithPort = req.get('host');
  const client = new ApolloClient({
    ssrMode: true,
    link: new HttpLink({ uri: `${req.protocol}://${hostWithPort}/graphql`, fetch }),
    cache: new InMemoryCache(),
  });

  return client;
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
