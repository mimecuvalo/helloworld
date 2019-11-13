import { defineMessages, F, useIntl } from '../../shared/i18n';
import gql from 'graphql-tag';
import Forbidden from '../error/403';
import React, { useContext } from 'react';
import styles from './Admin.module.css';
import Unauthorized from '../error/401';
import UserContext from '../app/User_Context';
import useDocumentTitle from '../app/title';
import { useQuery } from '@apollo/react-hooks';

const messages = defineMessages({
  title: { msg: 'Admin' },
});

const FETCH_ALL_USERS = gql`
  {
    fetchAllUsers {
      description
      email
      favicon
      google_analytics
      hostname
      license
      logo
      magic_key
      name
      private_key
      superuser
      theme
      title
      username
      viewport
    }
  }
`;

export default function Admin() {
  const user = useContext(UserContext).user;

  if (!user) {
    return <Unauthorized />;
  }

  if (!user?.model?.superuser) {
    return <Forbidden />;
  }

  return <AdminApp />;
}

function AdminApp() {
  const intl = useIntl();
  const { loading, data } = useQuery(FETCH_ALL_USERS);

  const title = intl.formatMessage(messages.title);
  useDocumentTitle(title);

  if (loading) {
    return null;
  }

  const allUsers = data.fetchAllUsers;

  return (
    <div id="hw-admin" className={styles.container}>
      <nav className={styles.nav}>
        <F msg="Users" />
      </nav>

      <article className={styles.content}>
        <table>
          <thead>
            <tr>
              <th>
                <strong>username</strong>
              </th>
              {Object.keys(allUsers[0])
                .filter(k => k !== 'username')
                .map(key => (
                  <th key={key}>
                    <strong>{key}</strong>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {allUsers.map(user => {
              return (
                <tr key={user.username}>
                  <td>
                    <input readOnly type="text" value={user['username']} />
                  </td>
                  {Object.keys(user)
                    .filter(k => k !== 'username')
                    .map(key => (
                      <td key={key}>
                        <input
                          readOnly
                          type={typeof user[key] === 'boolean' ? 'checkbox' : 'text'}
                          checked={typeof user[key] === 'boolean' ? user[key] : null}
                          value={user[key] || ''}
                        />
                      </td>
                    ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </article>
    </div>
  );
}
