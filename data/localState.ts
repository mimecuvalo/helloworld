import { InMemoryCache, StoreObject, defaultDataIdFromObject, makeVar } from '@apollo/client';

// This is your app's local state. Which can be queried and modified via Apollo.
// Learn more here: https://www.apollographql.com/docs/react/data/local-state/

export const user = makeVar<User | null>(null);
export const experiments = makeVar({});

export const clientCache: InMemoryCache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        user: {
          read() {
            return user();
          },
        },
        experiments: {
          read() {
            return experiments();
          },
        },
      },
    },
  },
});

export function initializeLocalState(initialUser: User | null, initialExperiments: EnabledExperiment[]) {
  user(initialUser);
  experiments(initialExperiments);
}

// You can add custom caching controls based on your data model.
export function dataIdFromObject(obj: StoreObject) {
  switch (obj.__typename) {
    default:
      return defaultDataIdFromObject(obj); // fall back to default handling
  }
}
