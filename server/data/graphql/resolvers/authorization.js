import { ForbiddenError } from 'apollo-server-express';
import { combineResolvers, skip } from 'graphql-resolvers';

export const isAuthenticated = (parent, args, { modelUser }) =>
    modelUser ? skip : new ForbiddenError('Not logged in.');

export const isAdmin = combineResolvers(
  isAuthenticated,
  (parent, args, { modelUser: { superuser } }) =>
    superuser
      ? skip
      : new ForbiddenError('I call shenanigans.'),
);