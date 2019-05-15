// This file tries to create a centralized place for authorization so that it can be used
// in the app, API, and Apollo servers.
export const isAuthenticated = currentUser => !!currentUser;
export const isAuthor = currentUser => !!currentUser?.model;
export const isAdmin = currentUser => !!currentUser?.model?.superuser;

export default {
  isAuthenticated,
  isAuthor,
  isAdmin,
};
