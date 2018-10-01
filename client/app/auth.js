import Auth0Lock from 'auth0-lock';
import configuration from './configuration';

// Sets up the Auth0 object to be used later to create a login window.
export function createLock() {
  return new Auth0Lock(configuration.auth0_client_id, configuration.auth0_domain, {
    auth: {
      redirectUrl: `${window.location.protocol}//${window.location.host}/api/auth/callback?next=${
        window.location.href
      }`,
      responseType: 'code',
      params: {
        scope: 'openid profile email',
      },
    },
  });
}

// Wrapper function to saveLogin/removeLogin that sets the user object appropriately.
export function setUser(userObjOrUndefined) {
  if (!userObjOrUndefined) {
    removeLogin();
  } else {
    // Currently, we save the user only on server-side. If you want to use localStorage tokens http
    // only and don't need server-side rendering then you can implement logic here.
  }
}

// Internal function to this file to remove the user information.
async function removeLogin() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({
      next: window.location.href,
      _csrf: configuration.csrf,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  window.location.reload();
}
