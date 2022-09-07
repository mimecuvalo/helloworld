import { useContext, useEffect, useState } from 'react';

import { F } from 'shared/util/i18n';
import UserContext from 'client/app/User_Context';
import { profileUrl } from 'shared/util/url_factory';
import { setUser } from 'client/app/auth';

export default function Tools({ className }) {
  const user = useContext(UserContext).user;
  const [origin, setOrigin] = useState(null);

  useEffect(() => {
    // TODO(mime): need an isomorphic mechanism for host. Haven't written it yet.
    // This is lame obvs.
    setOrigin(window.location.origin);
  }, [origin]);

  const handleLogout = (evt) => {
    setUser(undefined);
  };

  function createBookmarklet(pathname) {
    return `
      javascript:void((function() {
        var e = document.createElement('script');
        var scriptUrl = '${origin}' + '${pathname}' + '?random=' + (Math.random() * 99999999);
        e.setAttribute('src', scriptUrl);
        document.body.appendChild(e)
      })())
    `;
  }

  const username = user.model.username;
  const followScript = createBookmarklet('/js/helloworld_follow.js');
  const reblogScript = createBookmarklet('/js/helloworld_reblog.js');

  return (
    <ul className={className}>
      <li>
        <a href={profileUrl(username)} target="_blank" rel="noopener noreferrer">
          <F defaultMessage="view site" />
        </a>
      </li>
      <li>
        <a href={followScript}>
          <F defaultMessage="follow bookmarklet" />
        </a>
      </li>
      <li>
        <a href={reblogScript}>
          <F defaultMessage="reblog bookmarklet" />
        </a>
      </li>
      <li>
        <a href="/api/data-liberation">
          <F defaultMessage="data liberation" />
        </a>
      </li>
      <li>
        <button className="hw-button-link" onClick={handleLogout}>
          <F defaultMessage="logout" />
        </button>
      </li>
    </ul>
  );
}