import { type AnchorHTMLAttributes, type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { F } from 'i18n';
import { profileUrl } from 'lib/url-factory';
import styles from './dashboard.module.css';

export default function Tools({ username }: { username: string }) {
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  const bookmarklet = (pathname: string) =>
    `javascript:void((function(){var e=document.createElement('script');e.setAttribute('src','${origin}${pathname}?random='+(Math.random()*99999999));document.body.appendChild(e)})())`;

  return (
    <ul className={styles.toolsBox}>
      <li>
        <a href={profileUrl(username)} target="_blank" rel="noreferrer noopener">
          <F defaultMessage="view site" />
        </a>
      </li>
      <li>
        <BookmarkletLink code={bookmarklet('/js/helloworld_follow.js')}>
          <F defaultMessage="follow bookmarklet" />
        </BookmarkletLink>
      </li>
      <li>
        <BookmarkletLink code={bookmarklet('/js/helloworld_reblog.js')}>
          <F defaultMessage="reblog bookmarklet" />
        </BookmarkletLink>
      </li>
      <li>
        <a href="/api/auth/signout">
          <F defaultMessage="logout" />
        </a>
      </li>
    </ul>
  );
}

// javascript: URLs can't be set via React's href (it strips them), so we set it
// on the DOM node after mount.
function BookmarkletLink({
  code,
  children,
  ...props
}: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement> & { code: string }>) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.setAttribute('href', code);
  }, [code]);
  return (
    <a ref={ref} {...props}>
      {children}
    </a>
  );
}
