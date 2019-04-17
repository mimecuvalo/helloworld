import classNames from 'classnames';
import { defineMessages, F, injectIntl } from '../../shared/i18n';
import FollowingFeeds from './FollowingFeeds';
import FollowingQuery from './FollowingQuery';
import FollowingSpecialFeeds from './FollowingSpecialFeeds';
import { graphql } from 'react-apollo';
import NewFeed from './actions/NewFeed';
import React, { PureComponent } from 'react';
import styles from './RemoteUsers.module.css';

const messages = defineMessages({
  search: { msg: 'search' },
});

const POLL_INTERVAL = 60 * 1000;

@injectIntl
@graphql(FollowingQuery)
class Following extends PureComponent {
  constructor(props) {
    super(props);

    this.searchInput = React.createRef();
  }

  handleSearchKeyUp = evt => {
    if (evt.key === 'Enter') {
      this.props.handleSetFeed('', this.searchInput.current.value);
    }
  };

  // It'd be nice to listen to the 'search' event for the (x) cancel button but it doesn't work w/ React?
  handleSearchChange = evt => {
    if (!this.searchInput.current.value) {
      this.props.handleSetFeed('', this.searchInput.current.value);
    }
  };

  render() {
    const following = this.props.data.fetchFollowing;
    const { className, handleSetFeed, userRemote, specialFeed } = this.props;
    const searchPlaceholder = this.props.intl.formatMessage(messages.search);

    return (
      <div className={classNames(className, styles.remoteUsers)}>
        <h2>
          <F msg="following" />
        </h2>

        <ul>
          <FollowingSpecialFeeds handleSetFeed={handleSetFeed} specialFeed={specialFeed} pollInterval={POLL_INTERVAL} />
          <FollowingFeeds
            following={following}
            handleSetFeed={handleSetFeed}
            currentUserRemote={userRemote}
            pollInterval={POLL_INTERVAL}
          />
        </ul>

        <NewFeed handleSetFeed={handleSetFeed} />

        <input
          className={styles.search}
          type="search"
          onKeyUp={this.handleSearchKeyUp}
          onChange={this.handleSearchChange}
          ref={this.searchInput}
          placeholder={searchPlaceholder}
        />
      </div>
    );
  }
}

export default Following;
