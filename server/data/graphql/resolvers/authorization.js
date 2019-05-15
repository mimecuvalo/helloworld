import authorization from '../../../util/authorization';
import { ForbiddenError } from 'apollo-server-express';
import { skip } from 'graphql-resolvers';

export const isAuthenticated = (parent, args, { currentUser }) =>
  authorization.isAuthenticated(currentUser) ? skip : new ForbiddenError('Not logged in.');

export const isAuthor = (parent, args, { currentUser }) =>
  authorization.isAuthor(currentUser) ? skip : new ForbiddenError('I call shenanigans.');

export const isAdmin = (parent, args, { currentUser }) =>
  authorization.isAdmin(currentUser) ? skip : new ForbiddenError('I call shenanigans.');
