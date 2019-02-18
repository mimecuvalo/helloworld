import { ForbiddenError } from 'apollo-server-express';
import { combineResolvers, skip } from 'graphql-resolvers';

export const isAuthenticated = (parent, args, { currentUser }) =>
  currentUser ? skip : new ForbiddenError('Not logged in.');

export const isAdmin = combineResolvers(
  isAuthenticated,
  (
    parent,
    args,
    {
      currentUser: {
        model: { superuser },
      },
    }
  ) => (superuser ? skip : new ForbiddenError('I call shenanigans.'))
);

export const isAuthor = combineResolvers(
  isAuthenticated,
  (parent, args, { currentUser: { model } }) => (model ? skip : new ForbiddenError('I call shenanigans.'))
);
