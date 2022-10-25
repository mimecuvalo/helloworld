import { FetchFollowersQuery, UserRemotePublic } from 'data/graphql-generated';
import { gql, useQuery } from '@apollo/client';

import { Avatar } from 'components';
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
    <div>
      <h2>
        <F defaultMessage="followers" />
      </h2>
      <ul>
        {followers.map((follower) => (
          <li key={follower.profileUrl}>
            <button
              className="notranslate"
              onClick={() => window.open(follower.profileUrl, follower.profileUrl, 'noopener,noreferrer')}
            >
              <Avatar src={follower.favicon || follower.avatar} />
              {follower.name || follower.username}
            </button>
            <FollowerMenu userRemote={follower as UserRemotePublic} handleSetFeed={handleSetFeed} />
          </li>
        ))}
      </ul>
    </div>
  );
}
