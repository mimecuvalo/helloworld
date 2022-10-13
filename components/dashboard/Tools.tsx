import { useContext, useEffect, useState } from 'react';

import { F } from 'i18n';
import UserContext from 'app/UserContext';
import { profileUrl } from 'util/url-factory';

export default function Tools({ className }: { className: string }) {
  const user = useContext(UserContext).user;
  const [origin, setOrigin] = useState(null);

  useEffect(() => {
    // TODO(mime): need an isomorphic mechanism for host. Haven't written it yet.
    // This is lame obvs.
    setOrigin(window.location.origin);
  }, [origin]);

  function createBookmarklet(pathname: string) {
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
        <button className="hw-button-link" href="/api/auth/logout">
          <F defaultMessage="logout" />
        </button>
      </li>
    </ul>
  );
}
