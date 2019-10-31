import Avatar from './Avatar';
import classNames from 'classnames';
import { F } from '../../shared/i18n';
import FollowerMenu from './FollowerMenu';
import gql from 'graphql-tag';
import React from 'react';
import styles from './RemoteUsers.module.css';
import { useQuery } from '@apollo/react-hooks';

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
  const { data } = useQuery(FETCH_FOLLOWERS);
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
              className="hw-button-link"
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
