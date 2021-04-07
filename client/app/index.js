import './index.css';

import * as serviceWorkerRegistration from './serviceWorkerRegistration';

import { IntlProvider, isInternalLocale, setLocales } from 'react-intl-wrapper';

import { ApolloProvider } from '@apollo/client';
import App from './App';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { StrictMode } from 'react';
import { ThemeProvider } from '@material-ui/core/styles';
import configuration from './configuration';
import createApolloClient from './apollo';
import reportWebVitals from './reportWebVitals';
import theme from 'shared/theme';

setLocales({
  defaultLocale: configuration.defaultLocale,
  locales: configuration.locales,
});

async function renderAppTree(app) {
  const client = createApolloClient();

  let translations = {};
  // This is to dynamically load language packs as needed. We don't need them all client-side.
  if (configuration.locale !== configuration.defaultLocale && !isInternalLocale(configuration.locale)) {
    translations = (await import(`shared/i18n-lang-packs/${configuration.locale}`)).default;
  }

  return (
    <StrictMode>
      <IntlProvider defaultLocale={configuration.locale} locale={configuration.locale} messages={translations}>
        <ApolloProvider client={client}>
          <Router>
            <ThemeProvider theme={theme}>{app}</ThemeProvider>
          </Router>
        </ApolloProvider>
      </IntlProvider>
    </StrictMode>
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
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
function sendToAnalytics({ id, name, value }) {
  window['ga'] &&
    window['ga']('send', 'event', {
      eventCategory: 'Web Vitals',
      eventAction: name,
      eventValue: Math.round(name === 'CLS' ? value * 1000 : value), // values must be integers
      eventLabel: id, // id unique to current page load
      nonInteraction: true, // avoids affecting bounce rate
    });
}
reportWebVitals(sendToAnalytics);
