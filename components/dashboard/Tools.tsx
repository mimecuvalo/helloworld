import { Button, Link, List, ListItem, styled } from 'components';
import { useContext, useEffect, useState } from 'react';

import { F } from 'i18n';
import UserContext from 'app/UserContext';
import { profileUrl } from 'util/url-factory';

const StyledList = styled(List)`
  margin: 0 ${(props) => props.theme.spacing(2)} ${(props) => props.theme.spacing(3.5)} 0;
  padding: ${(props) => props.theme.spacing(1)};
  border: 1px solid ${(props) => props.theme.palette.secondary.main};
  box-shadow:
    1px 1px ${(props) => props.theme.palette.secondary.main},
    2px 2px ${(props) => props.theme.palette.secondary.main},
    3px 3px ${(props) => props.theme.palette.secondary.main};

  a {
    font-size: ${(props) => props.theme.typography.body2};
  }
`;

export default function Tools() {
  const { user } = useContext(UserContext);
  const [origin, setOrigin] = useState('');

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

  const username = user?.username || '';
  const followScript = createBookmarklet('/js/helloworld_follow.js');
  const reblogScript = createBookmarklet('/js/helloworld_reblog.js');

  return (
    <StyledList>
      <ListItem>
        <Link href={profileUrl(username)} target="_blank">
          <F defaultMessage="view site" />
        </Link>
      </ListItem>
      <ListItem>
        <a href={followScript} style={{ textDecoration: 'none' }}>
          <F defaultMessage="follow bookmarklet" />
        </a>
      </ListItem>
      <ListItem>
        <a href={reblogScript} style={{ textDecoration: 'none' }}>
          <F defaultMessage="reblog bookmarklet" />
        </a>
      </ListItem>
      {/* <ListItem>
        <Link href="/api/data-liberation">
          <F defaultMessage="data liberation" />
        </Link>
      </ListItem> */}
      <ListItem>
        <Button href="/api/auth/logout">
          <F defaultMessage="logout" />
        </Button>
      </ListItem>
    </StyledList>
  );
}
