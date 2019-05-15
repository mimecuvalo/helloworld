import { defineMessages, F, injectIntl } from '../../shared/i18n';
import DocumentTitle from 'react-document-title';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './Admin.module.css';
import Unauthorized from '../error/401';
import UserContext from '../app/User_Context';

const messages = defineMessages({
  title: { msg: 'Admin' },
});

@injectIntl
@graphql(gql`
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
`)
class Admin extends PureComponent {
  render() {
    const title = this.props.intl.formatMessage(messages.title);
    const allUsers = this.props.data.fetchAllUsers;

    return (
      <UserContext.Consumer>
        {({ user }) =>
          !user?.model?.superuser ? (
            <Unauthorized />
          ) : (
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
          )
        }
      </UserContext.Consumer>
    );
  }
}

export default Admin;
