import { ApolloProvider, getDataFromTree } from 'react-apollo';
import App from '../../client/app/App';
import createApolloClient from '../data/apollo_client';
import { DEFAULT_LOCALE, getLocale } from './locale';
import HTMLBase from './HTMLBase';
import { IntlProvider } from 'react-intl';
import * as languages from '../../shared/i18n/languages';
import React from 'react';
import { renderToNodeStream } from 'react-dom/server';
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

  const completeApp = (
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
            <App user={filteredUser} />
          </StaticRouter>
        </HTMLBase>
      </ApolloProvider>
    </IntlProvider>
  );

  // This is so we can do `apolloClient.extract()` later on.
  try {
    await getDataFromTree(completeApp);
  } catch (ex) {
    next(ex);
    return;
  }

  res.type('html');
  res.write('<!doctype html>');
  const stream = renderToNodeStream(completeApp);
  stream
    .on('error', function(err) {
      next(err);
    })
    .pipe(res);

  if (context.url) {
    res.redirect(301, context.url);
    return;
  }
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