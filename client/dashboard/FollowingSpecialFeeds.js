import Avatar from './Avatar';
import classNames from 'classnames';
import { F } from '../../shared/i18n';
import FollowingAllMenu from './FollowingAllMenu';
import FollowingSpecialFeedCountsQuery from './FollowingSpecialFeedCountsQuery';
import { FormattedNumber } from '../../shared/i18n';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './RemoteUsers.module.css';
import UserContext from '../app/User_Context';

@graphql(FollowingSpecialFeedCountsQuery, {
  options: ({ pollInterval }) => ({
    pollInterval,
  }),
})
class FollowingSpecialFeeds extends PureComponent {
  static contextType = UserContext;

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

  render() {
    const { commentsCount, favoritesCount, totalCount } = this.props.data.fetchUserTotalCounts;
    const { specialFeed } = this.props;
    const userFavicon = this.context.user.model.favicon;
    const userAvatar = <Avatar src={userFavicon || '/favicon.ico'} />;

    return (
      <>
        <li className={styles.readAll}>
          <a href="#read-all" onClick={this.handleEntireFeedClick}>
            <F msg="read all" />
          </a>
          <span className={styles.unreadCount}>
            <FormattedNumber value={totalCount} />
          </span>
          <FollowingAllMenu />
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
          <span className={styles.unreadCount}>
            <FormattedNumber value={favoritesCount} />
          </span>
        </li>
        <li className={classNames({ [styles.selected]: specialFeed === 'comments' })}>
          <a href="#comments" onClick={this.handleCommentsClick}>
            {userAvatar}
            <F msg="comments" />
          </a>
          <span className={styles.unreadCount}>
            <FormattedNumber value={commentsCount} />
          </span>
        </li>
      </>
    );
  }
}

export default FollowingSpecialFeeds;
