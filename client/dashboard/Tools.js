import { F } from '../../shared/i18n';
import { profileUrl } from '../../shared/util/url_factory';
import React, { useContext, useEffect, useState } from 'react';
import { setUser } from '../app/auth';
import UserContext from '../app/User_Context';

export default function Tools({ className }) {
  const user = useContext(UserContext).user;
  const [origin, setOrigin] = useState(null);

  useEffect(() => {
    // TODO(mime): need an isomorphic mechanism for host. Haven't written it yet.
    // This is lame obvs.
    setOrigin(window.location.origin);
  }, [origin]);

  const handleLogout = evt => {
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
          <F msg="view site" />
        </a>
      </li>
      <li>
        <a href={followScript}>
          <F msg="follow bookmarklet" />
        </a>
      </li>
      <li>
        <a href={reblogScript}>
          <F msg="reblog bookmarklet" />
        </a>
      </li>
      <li>
        <a href="/api/data-liberation">
          <F msg="data liberation" />
        </a>
      </li>
      <li>
        <button className="hw-button-link" onClick={handleLogout}>
          <F msg="logout" />
        </button>
      </li>
    </ul>
  );
}
