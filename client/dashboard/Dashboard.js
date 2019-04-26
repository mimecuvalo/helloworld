import DashboardEditor from './Editor';
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

@injectIntl
class Dashboard extends PureComponent {
  constructor(props) {
    super(props);

    this.editor = React.createRef();

    this.state = {
      shouldShowAllItems: false,
      didFeedLoad: false,
      query: null,
      specialFeed: '',
      userRemote: null,
    };
  }

  handleSetFeed = (userRemoteOrSpecialFeed, opt_query, opt_allItems) => {
    const newState = {
      didFeedLoad: true,
      query: opt_query,
      shouldShowAllItems: !!opt_allItems,
    };

    typeof userRemoteOrSpecialFeed === 'string'
      ? this.setState(Object.assign(newState, { specialFeed: userRemoteOrSpecialFeed, userRemote: null }))
      : this.setState(Object.assign(newState, { userRemote: userRemoteOrSpecialFeed, specialFeed: '' }));
  };

  getEditor = () => {
    // Oof :-/
    return this.editor.current.getWrappedInstance().getWrappedInstance();
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
              <div id="hw-dashboard" className={styles.container}>
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
                  <DashboardEditor ref={this.editor} username={user.model.username} />
                  {this.state.specialFeed === 'me' ? (
                    <MyFeed
                      content={{ username: user.model.username, section: 'main', name: 'home' }}
                      didFeedLoad={this.state.didFeedLoad}
                    />
                  ) : (
                    <Feed
                      didFeedLoad={this.state.didFeedLoad}
                      getEditor={this.getEditor}
                      query={this.state.query}
                      shouldShowAllItems={this.state.shouldShowAllItems}
                      specialFeed={this.state.specialFeed}
                      userRemote={this.state.userRemote}
                    />
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

export default Dashboard;
