import _ from 'lodash';
import classNames from 'classnames';
import FollowingFeedCountsQuery from './FollowingFeedCountsQuery';
import FollowingSpecialFeedCountsQuery from './FollowingSpecialFeedCountsQuery';
import Footer from './Footer';
import gql from 'graphql-tag';
import Header from './Header';
import React, { useState } from 'react';
import styles from './Item.module.css';
import { useEffect, useMutation, useRef } from '@apollo/react-hooks';

const READ_CONTENT_REMOTE = gql`
  mutation readContentRemote($from_user: String!, $post_id: String!, $read: Boolean!) {
    readContentRemote(from_user: $from_user, post_id: $post_id, read: $read) {
      from_user
      post_id
      read
    }
  }
`;

export default function Item(props) {
  const [readContentRemote, result] = useMutation(READ_CONTENT_REMOTE);
  const [keepUnread, setKeepUnread] = useState(false);
  const item = useRef(null);

  useEffect(() => {
    if (!props.contentRemote.read) {
      addEventListeners();
    }

    return () => removeEventListeners();
  });

  const maybeMarkAsRead = () => {
    const doc = document.documentElement;
    const bottomOfFeed = doc.scrollTop + window.innerHeight >= doc.scrollHeight - 50;
    if (!keepUnread && item.current && (item.current.getBoundingClientRect().top < 5 || bottomOfFeed)) {
      removeEventListeners();

      readContentRemoteCall(true);
    }
  };
  const throttledMaybeMarkAsRead = _.throttle(maybeMarkAsRead, 100);

  function addEventListeners() {
    window.addEventListener('scroll', throttledMaybeMarkAsRead, { passive: true });
    window.addEventListener('resize', throttledMaybeMarkAsRead, { passive: true });
  }

  function removeEventListeners() {
    window.removeEventListener('scroll', throttledMaybeMarkAsRead);
    window.removeEventListener('resize', throttledMaybeMarkAsRead);
  }

  function readContentRemoteCall(read) {
    const { from_user, post_id } = props.contentRemote;
    const variables = { from_user, post_id };
    const expectedResponse = Object.assign({}, variables, { __typename: 'Post' });

    readContentRemote({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        readContentRemote: expectedResponse,
      },
      update: (store, { data: { readContentRemote } }) => {
        const specialQuery = FollowingSpecialFeedCountsQuery;
        const specialData = store.readQuery({ query: specialQuery });
        specialData.fetchUserTotalCounts.totalCount += variables.read ? -1 : 1;
        store.writeQuery({ query: specialQuery, data: specialData });

        const query = FollowingFeedCountsQuery;
        const data = store.readQuery({ query });
        data.fetchFeedCounts.find(i => i.from_user === from_user).count += read ? -1 : 1;
        store.writeQuery({ query, data });
      },
    });
  }

  const keepUnreadCb = keepUnread => {
    if (keepUnread && props.contentRemote.read) {
      readContentRemoteCall(false);
      addEventListeners();
    }

    setKeepUnread(keepUnread);
  };

  const contentRemote = props.contentRemote;

  // Make all links open in new tab.
  const decoratedView = contentRemote.view.replace(/<a ([^>]+)/g, '<a $1 target="_blank" rel="noreferrer noopener"');

  return (
    <article ref={item} className={classNames('hw-item', styles.item)}>
      <Header contentRemote={contentRemote} />
      <div dangerouslySetInnerHTML={{ __html: decoratedView }} />
      <Footer contentRemote={contentRemote} keepUnreadCb={keepUnreadCb} getEditor={props.getEditor} />
    </article>
  );
}
