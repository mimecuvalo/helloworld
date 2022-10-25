import { Button, styled } from '@mui/material';

import { F } from 'i18n';
import Login from './Login';
import UserContext from 'app/UserContext';
import { useContext } from 'react';
import { useRouter } from 'next/router';

const StyledHeader = styled('header')`
  display: block;
  position: fixed;
  top: 10px;
  right: 10px;

  & a,
  & a:visited {
    color: #060;
  }

  & button {
    margin-left: 10px;
  }
`;

export default function Header() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const isLoggedIn = !!user;
  const isAuthor = !!user?.username;

  return (
    <StyledHeader>
      <nav>
        {isAuthor && router.pathname !== '/dashboard' ? (
          <Button variant="contained" color="primary" href="/dashboard">
            <F defaultMessage="dashboard" />
          </Button>
        ) : null}
        {!isLoggedIn || !isAuthor ? <Login /> : null}
      </nav>
    </StyledHeader>
  );
}
