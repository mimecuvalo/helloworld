import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { dataIdFromObject } from '../../shared/data/apollo';
import fetch from 'node-fetch';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';
import { typeDefs, resolvers } from '../../shared/data/local_state';

// We create an Apollo client here on the server so that we can get server-side rendering in properly.
export default function createApolloClient(req) {
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

  const cookieAndHostLink = new ApolloLink((operation, forward) => {
    operation.setContext({
      headers: {
        cookie: req.get('cookie'),
        'x-user-agent': req.headers['user-agent'],
        'x-forwarded-host': req.hostname,
      },
    });
    return forward(operation);
  });

  const httpLink = new HttpLink({ uri: `http://localhost:${req.socket.localPort}/graphql`, fetch });

  const link = ApolloLink.from([errorLink, cookieAndHostLink, httpLink]);

  const client = new ApolloClient({
    ssrMode: true,
    link,
    cache: new InMemoryCache({ dataIdFromObject }),
    typeDefs,
    resolvers,
  });

  return client;
}
