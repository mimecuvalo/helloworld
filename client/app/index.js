import { ApolloProvider } from '@apollo/react-hooks';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import configuration from '../app/configuration';
import createApolloClient from './apollo';
import './index.css';
import { IntlProvider } from 'react-intl';
import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import theme from '../../shared/theme';
import { ThemeProvider } from '@material-ui/core/styles';

async function renderAppTree(app) {
  const client = createApolloClient();

  let translations = {};
  if (configuration.locale !== configuration.defaultLocale) {
    translations = (await import(`../../shared/i18n/${configuration.locale}`)).default;
  }

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
  // TODO(mime): migrate window.configuration.user to LOCAL_STATE
  const appTree = await renderAppTree(<App user={window.configuration.user} />);
  ReactDOM.hydrate(appTree, document.getElementById('root'));
}
render();

// This enables hot module reloading for JS (HMR).
if (module.hot) {
  async function hotModuleRender() {
    const NextApp = require('./App').default;
    // TODO(mime): migrate window.configuration.user to LOCAL_STATE
    const appTree = await renderAppTree(<NextApp user={window.configuration.user} />);
    ReactDOM.render(appTree, document.getElementById('root'));
  }
  module.hot.accept('./App', hotModuleRender);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
