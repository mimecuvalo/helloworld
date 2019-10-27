import App from './App';
import ApolloClient from 'apollo-client';
import { ApolloProvider } from '@apollo/react-hooks';
import { BrowserRouter as Router } from 'react-router-dom';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { IntlProvider } from 'react-intl';
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';

it('renders without crashing', () => {
  window.scrollTo = () => {}; // Used in app/App.js

  const div = document.createElement('div');

  const client = new ApolloClient({
    link: new HttpLink({ apolloUrl: '/graphql' }),
    cache: new InMemoryCache(),
  });

  const theme = createMuiTheme({
    typography: {
      useNextVariants: true,
    },
  });

  ReactDOM.render(
    <IntlProvider locale={'en'} messages={{}}>
      <ApolloProvider client={client}>
        <Router>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </Router>
      </ApolloProvider>
    </IntlProvider>,
    div
  );
  ReactDOM.unmountComponentAtNode(div);
});
