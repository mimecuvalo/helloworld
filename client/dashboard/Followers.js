import Avatar from './Avatar';
import classNames from 'classnames';
import { F } from 'react-intl-wrapper';
import FollowerMenu from './FollowerMenu';
import gql from 'graphql-tag';
import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import useStyles from './remoteUsersStyles';

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

export default function Followers(props) {
  const { loading, data } = useQuery(FETCH_FOLLOWERS);
  const styles = useStyles();

  if (loading) {
    return null;
  }

  const followers = data.fetchFollowers;

  return (
    <div className={classNames(props.className, styles.remoteUsers)}>
      <h2>
        <F msg="followers" />
      </h2>
      <ul>
        {followers.map(follower => (
          <li key={follower.profile_url}>
            <button
              className="hw-button-link notranslate"
              onClick={() => window.open(follower.profile_url, follower.profile_url, 'noopener,noreferrer')}
            >
              <Avatar src={follower.favicon || follower.avatar} />
              {follower.name || follower.username}
            </button>
            <FollowerMenu userRemote={follower} handleSetFeed={props.handleSetFeed} />
          </li>
        ))}
      </ul>
    </div>
  );
}
