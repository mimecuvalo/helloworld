import { Button, styled } from '@mui/material';
import { gql, useQuery } from '@apollo/client';

import { F } from 'i18n';
import Login from './Login';
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
    marginsreft: 10px;
  }
`;

const USER_QUERY = gql`
  {
    user @client {
      model {
        username
      }
    }
  }
`;

export default function Header() {
  const router = useRouter();
  const { data } = useQuery(USER_QUERY);
  const isLoggedIn = !!data?.user;
  const isAuthor = !!data?.user?.model;

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
