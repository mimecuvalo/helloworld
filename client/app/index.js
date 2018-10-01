import { addLocaleData, IntlProvider } from 'react-intl';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import configuration from '../app/configuration';
import CurrentUser from './current_user';
import './index.css';
import { InMemoryCache } from 'apollo-cache-inmemory';
import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';

async function renderAppTree(app) {
  // We add the Apollo/GraphQL capabilities here (also notice ApolloProvider below).
  const client = new ApolloClient({
    request: async op => {
      op.setContext({
        headers: {
          'x-xsrf-token': configuration.csrf || '',
        },
      });
    },
    cache: new InMemoryCache().restore(window['__APOLLO_STATE__']),
  });

  let translations = {};
  if (configuration.locale !== configuration.defaultLocale) {
    translations = (await import(`../../shared/i18n/${configuration.locale}`)).default;
    const localeData = (await import(`react-intl/locale-data/${configuration.locale}`)).default;
    addLocaleData(localeData);
  }

  return (
    <IntlProvider locale={configuration.locale} messages={translations}>
      <ApolloProvider client={client}>
        <Router>{app}</Router>
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
