import { Avatar } from 'components';
import { F } from 'i18n';
import FollowingAllMenu from './FollowingAllMenu';
import FollowingSpecialFeedCountsQuery from './FollowingSpecialFeedCountsQuery';
import { FormattedNumber } from 'i18n';
import UserContext from 'app/UserContext';
import classNames from 'classnames';
import { useContext } from 'react';
import { useQuery } from '@apollo/client';

export default function FollowingSpecialFeeds({
  pollInterval,
  handleSetFeed,
  specialFeed,
}: {
  pollInterval: number;
  handleSetFeed: (userRemote: UserRemote) => void;
  specialFeed: string;
}) {
  const user = useContext(UserContext).user;
  const { loading, data } = useQuery(FollowingSpecialFeedCountsQuery, {
    pollInterval: pollInterval,
  });

  if (loading) {
    return null;
  }

  const handleEntireFeedClick = (evt) => {
    handleSetFeed('');
  };

  const handleMyFeedClick = (evt) => {
    handleSetFeed('me');
  };

  const handleFavoritesClick = (evt) => {
    handleSetFeed('favorites');
  };

  const handleCommentsClick = (evt) => {
    handleSetFeed('comments');
  };

  const { commentsCount, favoritesCount, totalCount } = data.fetchUserTotalCounts;
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
