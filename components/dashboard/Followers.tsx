import { Avatar, Button, List, ListItem, Typography, styled } from 'components';
import { FetchFollowersQuery, UserRemotePublic } from 'data/graphql-generated';
import { gql, useQuery } from '@apollo/client';

import { F } from 'i18n';
import FollowerMenu from './FollowerMenu';

const FETCH_FOLLOWERS = gql`
  query FetchFollowers {
    fetchFollowers {
      avatar
      favicon
      following
      name
      profileUrl
      username
    }
  }
`;

const Container = styled('div')`
  margin: 0 ${(props) => props.theme.spacing(2)} ${(props) => props.theme.spacing(2)} 0;
  padding: ${(props) => props.theme.spacing(1)};
  border: 1px solid ${(props) => props.theme.palette.success.main};
  box-shadow:
    1px 1px ${(props) => props.theme.palette.success.main},
    2px 2px ${(props) => props.theme.palette.success.main},
    3px 3px ${(props) => props.theme.palette.success.main};

  h2 {
    margin: 0;
  }
`;

export default function Followers({
  handleSetFeed,
}: {
  handleSetFeed: (userRemote: UserRemotePublic | string) => void;
}) {
  const { loading, data } = useQuery<FetchFollowersQuery>(FETCH_FOLLOWERS);

  if (loading || !data) {
    return null;
  }

  const followers = data.fetchFollowers;

  return (
    <Container>
      <Typography variant="h2">
        <F defaultMessage="followers" />
      </Typography>
      <List>
        {followers.map((follower) => (
          <ListItem key={follower.profileUrl}>
            <Button
              className="notranslate"
              onClick={() => window.open(follower.profileUrl, follower.profileUrl, 'noopener,noreferrer')}
              startIcon={<Avatar src={follower.favicon || follower.avatar} sx={{ width: 16, height: 16 }} />}
            >
              <span className="feed-name">{follower.name || follower.username}</span>
            </Button>
            <FollowerMenu userRemote={follower as UserRemotePublic} handleSetFeed={handleSetFeed} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
