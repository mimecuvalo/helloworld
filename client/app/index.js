import ApolloClient from 'apollo-client';
import { ApolloLink, split } from 'apollo-link';
import { ApolloProvider } from 'react-apollo';
import App from './App';
import { BatchHttpLink } from 'apollo-link-batch-http';
import { BrowserRouter as Router } from 'react-router-dom';
import { buildUrl } from '../../shared/util/url_factory';
import configuration from '../app/configuration';
import CurrentUser from './current_user';
import { dataIdFromObject } from '../../shared/data/apollo';
import { HttpLink } from 'apollo-link-http';
import './index.css';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { IntlProvider } from 'react-intl';
import { onError } from 'apollo-link-error';
import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';

async function renderAppTree(app) {
  const client = createApolloClient();

  let translations = {};
  if (configuration.locale !== configuration.defaultLocale) {
    translations = (await import(`../../shared/i18n/${configuration.locale}`)).default;
  }

  // For Material UI setup.
  const theme = createMuiTheme({
    typography: {
      useNextVariants: true,
    },
  });

  return (
    <IntlProvider locale={configuration.locale} messages={translations}>
      <ApolloProvider client={client}>
        <Router>
          <ThemeProvider theme={theme}>{app}</ThemeProvider>
        </Router>
      </ApolloProvider>
    </IntlProvider>
  );
}

// We use `hydrate` here so that we attach to our server-side rendered React components.
async function render() {
  const appTree = await renderAppTree(<App user={CurrentUser} />);
  ReactDOM.hydrate(appTree, document.getElementById('root'));
}
render();

function createApolloClient() {
  const apolloUrl = buildUrl({ isAbsolute: true, pathname: '/graphql' });
  // link to use if batching
  // also adds a `batch: true` header to the request to prove it's a different link (default)
  const batchHttpLink = new BatchHttpLink({ apolloUrl });
  // link to use if not batching
  const httpLink = new HttpLink({ apolloUrl });

  // We add the Apollo/GraphQL capabilities here (also notice ApolloProvider below).
  const cache = new InMemoryCache({ dataIdFromObject }).restore(window['__APOLLO_STATE__']);

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.map(({ message, locations, path }) =>
        console.log(`\n[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}\n`)
      );
    }
    if (networkError) {
      console.log(`\n[Network error]: ${networkError}\n`);
    }
  });
  const splitLink = split(
    op => op.getContext().important === true,
    httpLink, // if test is true, debatch
    batchHttpLink // otherwise, batch
  );
  const link = ApolloLink.from([errorLink, splitLink]);

  const client = new ApolloClient({
    request: async op => {
      op.setContext({
        headers: {
          'x-xsrf-token': configuration.csrf || '',
        },
      });
    },
    link,
    cache,
  });

  return client;
}

// This enables hot module reloading for JS (HMR).
if (module.hot) {
  async function hotModuleRender() {
    const NextApp = require('./App').default;
    const appTree = await renderAppTree(<NextApp user={CurrentUser} />);
    ReactDOM.render(appTree, document.getElementById('root'));
  }
  module.hot.accept('./App', hotModuleRender);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
