import { defineMessages, F, useIntl } from '../../shared/i18n';
import DocumentTitle from 'react-document-title';
import gql from 'graphql-tag';
import React, { useContext } from 'react';
import styles from './Admin.module.css';
import Unauthorized from '../error/401';
import UserContext from '../app/User_Context';
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
  const intl = useIntl();
  const user = useContext(UserContext);
  const { data } = useQuery(FETCH_ALL_USERS);

  const title = intl.formatMessage(messages.title);
  const allUsers = data.fetchAllUsers;

  if (!user?.model?.superuser) {
    return <Unauthorized />;
  }

  return (
    <DocumentTitle title={title}>
      <div id="hw-admin" className={styles.container}>
        <nav className={styles.nav}>
          <F msg="Users" />
        </nav>

        <article className={styles.content}>
          <table>
            <thead>
              <th>
                <strong>username</strong>
              </th>
              {Object.keys(allUsers[0])
                .filter(k => k !== 'username')
                .map(key => (
                  <th>
                    <strong>{key}</strong>
                  </th>
                ))}
            </thead>
            <tbody>
              {allUsers.map(user => {
                return (
                  <tr>
                    <td>
                      <input readOnly type="text" value={user['username']} />
                    </td>
                    {Object.keys(user)
                      .filter(k => k !== 'username')
                      .map(key => (
                        <td>
                          <input
                            readOnly
                            type={typeof user[key] === 'boolean' ? 'checkbox' : 'text'}
                            checked={typeof user[key] === 'boolean' ? user[key] : null}
                            value={user[key]}
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
    </DocumentTitle>
  );
}
