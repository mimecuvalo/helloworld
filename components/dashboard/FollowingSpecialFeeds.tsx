import { Avatar, Button, Chip, ListItem } from 'components';

import { ArrowDropDown } from '@mui/icons-material';
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
  const userAvatar = <Avatar src={userFavicon || '/favicon.jpg'} sx={{ width: 16, height: 16 }} />;

  return (
    <>
      <ListItem>
        <Button
          onClick={handleEntireFeedClick}
          startIcon={<span style={{ width: 16 }} />}
          endIcon={
            <Chip color="info" size="small" className="notranslate" label={<FormattedNumber value={totalCount} />} />
          }
        >
          <span className="feed-name">
            <F defaultMessage="read all" />
          </span>
        </Button>
        <FollowingAllMenu />
      </ListItem>
      <ListItem>
        <Button onClick={handleMyFeedClick} startIcon={userAvatar}>
          <span className="feed-name">
            <F defaultMessage="your feed" />
          </span>
        </Button>
      </ListItem>
      <ListItem>
        <Button
          onClick={handleFavoritesClick}
          startIcon={userAvatar}
          endIcon={
            <Chip
              color="info"
              size="small"
              className="notranslate"
              label={<FormattedNumber value={favoritesCount} />}
            />
          }
        >
          <span className="feed-name">
            <F defaultMessage="favorites" />
          </span>
        </Button>
        <Button sx={{ visibility: 'hidden', minWidth: 0 }}>
          <ArrowDropDown />
        </Button>
      </ListItem>
      <ListItem>
        <Button
          onClick={handleCommentsClick}
          startIcon={userAvatar}
          endIcon={
            <Chip color="info" size="small" className="notranslate" label={<FormattedNumber value={commentsCount} />} />
          }
        >
          <span className="feed-name">
            <F defaultMessage="comments" />
          </span>
        </Button>
        <Button sx={{ visibility: 'hidden', minWidth: 0 }}>
          <ArrowDropDown />
        </Button>
      </ListItem>
    </>
  );
}
