import { F, defineMessages, useIntl } from 'i18n';
import { gql, useQuery } from '@apollo/client';

import { FetchAllUsersQuery } from 'data/graphql-generated';
import Forbidden from 'components/error/403';
import Head from 'next/head';
import Unauthorized from 'components/error/401';
import UserContext from 'app/UserContext';
import { styled } from 'components';
import { useContext } from 'react';

const Container = styled('div')`
  display: flex;
  align-items: flex-start;
  margin: 64px 8px;
`;

const Content = styled('article')`
  display: flex;
  flex-direction: column;
  flex-flow: wrap;
  align-items: flex-start;
  width: 82%;
  margin: 6px;
  overflow-x: scroll;
`;

const Nav = styled('nav')`
  position: sticky;
  top: 0;
  width: 235px;
  height: 100vh;
  padding: var(--app-margin);
  overflow: scroll;
`;

const messages = defineMessages({
  title: { defaultMessage: 'Admin' },
});

const FETCH_ALL_USERS = gql`
  query FetchAllUsers {
    fetchAllUsers {
      description
      email
      favicon
      googleAnalytics
      hostname
      license
      logo
      magicKey
      name
      privateKey
      superuser
      theme
      title
      username
      viewport
    }
  }
`;

export default function Admin() {
  const { user } = useContext(UserContext);

  if (!user) {
    return <Unauthorized />;
  }

  if (!user.superuser) {
    return <Forbidden />;
  }

  return <AdminApp />;
}

function AdminApp() {
  const intl = useIntl();
  const { loading, data } = useQuery<FetchAllUsersQuery>(FETCH_ALL_USERS);

  const title = intl.formatMessage(messages.title);

  if (loading || !data) {
    return null;
  }

  const allUsers = data.fetchAllUsers;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Container id="hw-admin">
        <Nav>
          <F defaultMessage="Users" />
        </Nav>

        <Content>
          <table>
            <thead>
              <tr>
                <th>
                  <strong>username</strong>
                </th>
                {Object.keys(allUsers[0])
                  .filter((k) => k !== 'username')
                  .map((key) => (
                    <th key={key}>
                      <strong>{key}</strong>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => {
                return (
                  <tr key={user.username}>
                    <td>
                      <input readOnly type="text" value={user['username']} />
                    </td>
                    {Object.keys(user)
                      .filter((k) => k !== 'username')
                      .map((key: string) => (
                        <td key={key}>
                          <input
                            readOnly
                            // @ts-ignore this is fine
                            type={typeof user[key] === 'boolean' ? 'checkbox' : 'text'}
                            // @ts-ignore this is fine
                            checked={typeof user[key] === 'boolean' ? user[key] : null}
                            // @ts-ignore this is fine
                            value={user[key] || ''}
                          />
                        </td>
                      ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Content>
      </Container>
    </>
  );
}
