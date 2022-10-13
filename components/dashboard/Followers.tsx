import { gql, useQuery } from '@apollo/client';

import { Avatar } from 'components';
import { F } from 'i18n';
import FollowerMenu from './FollowerMenu';

const FETCH_FOLLOWERS = gql`
  {
    fetchFollowers {
      avatar
      favicon
      following
      name
      profile_url
      username
    }
  }
`;

export default function Followers({ handleSetFeed }: (userRemote: UserRemote) => void) {
  const { loading, data } = useQuery(FETCH_FOLLOWERS);

  if (loading) {
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
          <li key={follower.profile_url}>
            <button
              className="hw-button-link notranslate"
              onClick={() => window.open(follower.profile_url, follower.profile_url, 'noopener,noreferrer')}
            >
              <Avatar src={follower.favicon || follower.avatar} />
              {follower.name || follower.username}
            </button>
            <FollowerMenu userRemote={follower} handleSetFeed={handleSetFeed} />
          </li>
        ))}
      </ul>
    </div>
  );
}
