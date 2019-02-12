import { defineMessages, injectIntl } from '../../shared/i18n';
import DocumentTitle from 'react-document-title';
import Feed from './Feed';
import Followers from './Followers';
import Following from './Following';
import MyFeed from '../content/Feed';
import React, { PureComponent } from 'react';
import styles from './Dashboard.module.css';
import Tools from './Tools';
import Unauthorized from '../error/401';
import UserContext from '../app/User_Context';

const messages = defineMessages({
  title: { msg: 'Dashboard' },
});

class Dashboard extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      specialFeed: '',
      userRemote: undefined,
    };
  }

  handleSetFeed = userRemoteOrSpecialFeed => {
    typeof userRemoteOrSpecialFeed === 'string'
      ? this.setState({ specialFeed: userRemoteOrSpecialFeed, userRemote: undefined })
      : this.setState({ userRemote: userRemoteOrSpecialFeed, specialFeed: '' });
  };

  render() {
    const title = this.props.intl.formatMessage(messages.title);

    return (
      <UserContext.Consumer>
        {({ user }) =>
          !user ? (
            <Unauthorized />
          ) : (
            <DocumentTitle title={title}>
              <div className={styles.container}>
                <nav className={styles.nav}>
                  <Tools className={styles.tools} />
                  <Following
                    className={styles.following}
                    handleSetFeed={this.handleSetFeed}
                    specialFeed={this.state.specialFeed}
                    userRemote={this.state.userRemote}
                  />
                  <Followers className={styles.followers} />
                </nav>

                <article className={styles.content}>
                  {this.state.specialFeed === 'me' ? (
                    <MyFeed content={{ username: user.model.username, section: 'main', name: 'home' }} />
                  ) : (
                    <Feed specialFeed={this.state.specialFeed} userRemote={this.state.userRemote} />
                  )}
                </article>
              </div>
            </DocumentTitle>
          )
        }
      </UserContext.Consumer>
    );
  }
}

export default injectIntl(Dashboard);
