import Avatar from './Avatar';
import classNames from 'classnames';
import { defineMessages, F, injectIntl } from '../../shared/i18n';
import FollowingFeeds from './FollowingFeeds';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './RemoteUsers.module.css';
import UserContext from '../app/User_Context';

const messages = defineMessages({
  search: { msg: 'search' },
});

@graphql(gql`
  query FollowingQuery {
    fetchFollowing {
      avatar
      favicon
      name
      profile_url
      username
    }

    fetchUserTotalCounts {
      commentsCount
      favoritesCount
      totalCount
    }
  }
`)
class Following extends PureComponent {
  static contextType = UserContext;

  constructor(props) {
    super(props);

    this.searchInput = React.createRef();
  }

  handleEntireFeedClick = evt => {
    evt.preventDefault();
    this.props.handleSetFeed('');
  };

  handleMyFeedClick = evt => {
    evt.preventDefault();
    this.props.handleSetFeed('me');
  };

  handleFavoritesClick = evt => {
    evt.preventDefault();
    this.props.handleSetFeed('favorites');
  };

  handleCommentsClick = evt => {
    evt.preventDefault();
    this.props.handleSetFeed('comments');
  };

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
    const { commentsCount, favoritesCount, totalCount } = this.props.data.fetchUserTotalCounts;
    const { userRemote, specialFeed } = this.props;
    const userFavicon = this.context.user.model.favicon;
    const userAvatar = <Avatar src={userFavicon || '/favicon.ico'} />;
    const searchPlaceholder = this.props.intl.formatMessage(messages.search);

    return (
      <div className={classNames(this.props.className, styles.remoteUsers)}>
        <h2>
          <F msg="following" />
        </h2>
        <ul>
          <li>
            <a href="#read-all" onClick={this.handleEntireFeedClick}>
              <F msg="read all" />
            </a>
            <span className={styles.unreadCount}>{totalCount}</span>
          </li>
          <li className={classNames({ [styles.selected]: specialFeed === 'me' })}>
            <a href="#your-feed" onClick={this.handleMyFeedClick}>
              {userAvatar}
              <F msg="your feed" />
            </a>
          </li>
          <li className={classNames({ [styles.selected]: specialFeed === 'favorites' })}>
            <a href="#your-favorites" onClick={this.handleFavoritesClick}>
              {userAvatar}
              <F msg="favorites" />
            </a>
            <span className={styles.unreadCount}>{favoritesCount}</span>
          </li>
          <li className={classNames({ [styles.selected]: specialFeed === 'comments' })}>
            <a href="#comments" onClick={this.handleCommentsClick}>
              {userAvatar}
              <F msg="comments" />
            </a>
            <span className={styles.unreadCount}>{commentsCount}</span>
          </li>
          <FollowingFeeds
            following={following}
            handleSetFeed={this.props.handleSetFeed}
            currentUserRemote={userRemote}
          />
          <input
            className={styles.search}
            type="search"
            onKeyUp={this.handleSearchKeyUp}
            onChange={this.handleSearchChange}
            ref={this.searchInput}
            placeholder={searchPlaceholder}
          />
        </ul>
      </div>
    );
  }
}

export default injectIntl(Following);
