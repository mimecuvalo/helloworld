import { Avatar } from 'components';
import { F } from 'i18n';
import FollowingAllMenu from './FollowingAllMenu';
import FollowingSpecialFeedCountsQuery from './FollowingSpecialFeedCountsQuery';
import { FormattedNumber } from 'i18n';
import UserContext from 'app/UserContext';
import { UserRemotePublic } from 'data/graphql-generated';
import { useContext } from 'react';
import { useQuery } from '@apollo/client';

export default function FollowingSpecialFeeds({
  pollInterval,
  handleSetFeed,
}: {
  pollInterval: number;
  handleSetFeed: (userRemote: UserRemotePublic | string, search?: string) => void;
  specialFeed: string;
}) {
  const { user } = useContext(UserContext);
  const { loading, data } = useQuery(FollowingSpecialFeedCountsQuery, {
    pollInterval: pollInterval,
  });

  if (loading) {
    return null;
  }

  const handleEntireFeedClick = () => {
    handleSetFeed('');
  };

  const handleMyFeedClick = () => {
    handleSetFeed('me');
  };

  const handleFavoritesClick = () => {
    handleSetFeed('favorites');
  };

  const handleCommentsClick = () => {
    handleSetFeed('comments');
  };

  const { commentsCount, favoritesCount, totalCount } = data.fetchUserTotalCounts;
  const userFavicon = user?.favicon;
  const userAvatar = <Avatar src={userFavicon || '/favicon.jpg'} />;

  return (
    <>
      <li>
        <button className="hw-button-link" onClick={handleEntireFeedClick}>
          <F defaultMessage="read all" />
        </button>
        <span>
          <FormattedNumber value={totalCount} />
        </span>
        <FollowingAllMenu />
      </li>
      <li>
        <button className="hw-button-link" onClick={handleMyFeedClick}>
          {userAvatar}
          <F defaultMessage="your feed" />
        </button>
        <span />
      </li>
      <li>
        <button className="hw-button-link" onClick={handleFavoritesClick}>
          {userAvatar}
          <F defaultMessage="favorites" />
        </button>
        <span>
          <FormattedNumber value={favoritesCount} />
        </span>
      </li>
      <li>
        <button className="hw-button-link" onClick={handleCommentsClick}>
          {userAvatar}
          <F defaultMessage="comments" />
        </button>
        <span>
          <FormattedNumber value={commentsCount} />
        </span>
      </li>
    </>
  );
}
