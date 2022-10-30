import { InMemoryCache, StoreObject, defaultDataIdFromObject } from '@apollo/client';

// This is your app's local state. Which can be queried and modified via Apollo.
// Learn more here: https://www.apollographql.com/docs/react/data/local-state/

export const clientCache: InMemoryCache = new InMemoryCache({ dataIdFromObject });

export function initializeLocalState() {
  /* todo */
}

export function dataIdFromObject(obj: StoreObject) {
  switch (obj.__typename) {
    case 'Content':
      return `${prefixIdFromObject(obj)}${obj.name}`;
    case 'Post':
    case 'Comment':
    case 'Favorite':
      return `${prefixIdFromObject(obj)}${obj.postId}`;
    case 'UserPublic':
      return `${prefixIdFromObject(obj)}`;
    case 'UserRemotePublic':
      return `${prefixIdFromObject(obj)}`;
    case 'FeedCount':
      return `${prefixIdFromObject(obj)}`;
    default:
      return defaultDataIdFromObject(obj); // fall back to default handling
  }
}

export function prefixIdFromObject(obj: StoreObject) {
  const type = obj.__typename;

  switch (obj.__typename) {
    case 'Content':
      return `${type} ${obj.username} `;
    case 'Post':
    case 'Comment':
    case 'Favorite':
      return obj.fromUsername ? `${type} ${obj.fromUsername} ` : `${type} `;
    case 'UserPublic':
      return `${type} ${obj.username}`;
    case 'UserRemotePublic':
      return `${type} ${obj.profileUrl}`;
    case 'FeedCount':
      return `${type} ${obj.fromUsername}`;
    default:
      throw new Error('not supported');
  }
}
