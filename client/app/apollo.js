import ApolloClient from 'apollo-client';
import { ApolloLink, split } from 'apollo-link';
import { BatchHttpLink } from 'apollo-link-batch-http';
import { buildUrl } from '../../shared/util/url_factory';
import configuration from '../app/configuration';
import { dataIdFromObject } from '../../shared/data/apollo';
import { HttpLink } from 'apollo-link-http';
import { initializeCurrentUser } from '../../shared/data/local_state';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';
import { typeDefs, resolvers } from '../../shared/data/local_state';

export default function createApolloClient() {
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

  initializeCurrentUser(configuration.user);
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
    typeDefs,
    resolvers,
  });

  return client;
}
