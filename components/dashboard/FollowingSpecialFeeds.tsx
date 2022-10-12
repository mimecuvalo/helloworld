import Avatar from './Avatar';
import { F } from 'shared/util/i18n';
import FollowingAllMenu from './FollowingAllMenu';
import FollowingSpecialFeedCountsQuery from './FollowingSpecialFeedCountsQuery';
import { FormattedNumber } from 'shared/util/i18n';
import UserContext from 'client/app/User_Context';
import classNames from 'classnames';
import { useContext } from 'react';
import { useQuery } from '@apollo/client';
import useStyles from './remoteUsersStyles';

export default function FollowingSpecialFeeds(props) {
  const user = useContext(UserContext).user;
  const { loading, data } = useQuery(FollowingSpecialFeedCountsQuery, {
    pollInterval: props.pollInterval,
  });
  const styles = useStyles();

  if (loading) {
    return null;
  }

  const handleEntireFeedClick = (evt) => {
    props.handleSetFeed('');
  };

  const handleMyFeedClick = (evt) => {
    props.handleSetFeed('me');
  };

  const handleFavoritesClick = (evt) => {
    props.handleSetFeed('favorites');
  };

  const handleCommentsClick = (evt) => {
    props.handleSetFeed('comments');
  };

  const { commentsCount, favoritesCount, totalCount } = data.fetchUserTotalCounts;
  const { specialFeed } = props;
  const userFavicon = user.model.favicon;
  const userAvatar = <Avatar src={userFavicon || '/favicon.jpg'} />;

  return (
    <>
      <li className={styles.readAll}>
        <button className="hw-button-link" onClick={handleEntireFeedClick}>
          <F defaultMessage="read all" />
        </button>
        <span className={styles.unreadCount}>
          <FormattedNumber value={totalCount} />
        </span>
        <FollowingAllMenu />
      </li>
      <li className={classNames({ [styles.selected]: specialFeed === 'me' })}>
        <button className="hw-button-link" onClick={handleMyFeedClick}>
          {userAvatar}
          <F defaultMessage="your feed" />
        </button>
        <span />
      </li>
      <li className={classNames({ [styles.selected]: specialFeed === 'favorites' })}>
        <button className="hw-button-link" onClick={handleFavoritesClick}>
          {userAvatar}
          <F defaultMessage="favorites" />
        </button>
        <span className={styles.unreadCount}>
          <FormattedNumber value={favoritesCount} />
        </span>
      </li>
      <li className={classNames({ [styles.selected]: specialFeed === 'comments' })}>
        <button className="hw-button-link" onClick={handleCommentsClick}>
          {userAvatar}
          <F defaultMessage="comments" />
        </button>
        <span className={styles.unreadCount}>
          <FormattedNumber value={commentsCount} />
        </span>
      </li>
    </>
  );
}
