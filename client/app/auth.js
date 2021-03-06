import { buildUrl } from '../../shared/util/url_factory';
import configuration from './configuration';

let Auth0Lock;
if (typeof window !== 'undefined') {
  Auth0Lock = require('auth0-lock').default;
}

// Sets up the Auth0 object to be used later to create a login window.
export function createLock() {
  return new Auth0Lock(configuration.auth0_client_id, configuration.auth0_domain, {
    auth: {
      redirectUrl: buildUrl({
        isAbsolute: true,
        pathname: buildUrl({ pathname: '/api/auth/callback' }),
        searchParams: { next: window.location.href },
      }),
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
  await fetch(buildUrl({ pathname: '/api/auth/logout' }), {
    method: 'POST',
    body: JSON.stringify({
      next: window.location.origin,
      _csrf: configuration.csrf,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  window.location.reload();
}
