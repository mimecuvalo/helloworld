import { gql, useMutation } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';

import FollowingFeedCountsQuery from './FollowingFeedCountsQuery';
import FollowingSpecialFeedCountsQuery from './FollowingSpecialFeedCountsQuery';
import Footer from './Footer';
import Header from './Header';
import { ItemWrapper } from 'components/content/Feed';
import { Post } from 'data/graphql-generated';
import throttle from 'lodash/throttle';

const READ_CONTENT_REMOTE = gql`
  mutation readContentRemote($fromUsername: String!, $postId: String!, $read: Boolean!) {
    readContentRemote(fromUsername: $fromUsername, postId: $postId, read: $read) {
      fromUsername
      postId
      read
    }
  }
`;

export default function Item({ contentRemote }: { contentRemote: Post }) {
  const [readContentRemote] = useMutation(READ_CONTENT_REMOTE);
  const [keepUnread, setKeepUnread] = useState(false);
  const [manuallyMarkedAsRead, setManuallyMarkedAsRead] = useState(contentRemote.read);
  const item = useRef<Element>(null);

  useEffect(() => {
    if (!manuallyMarkedAsRead) {
      addEventListeners();
    }

    return () => removeEventListeners();
  });

  const maybeMarkAsRead = () => {
    const doc = document.documentElement;
    const bottomOfFeed = doc.scrollTop + window.innerHeight >= doc.scrollHeight - 50;
    if (!keepUnread && item.current && (item.current.getBoundingClientRect().top < 5 || bottomOfFeed)) {
      setManuallyMarkedAsRead(true);
      readContentRemoteCall(true);
    }
  };
  const throttledMaybeMarkAsRead = throttle(maybeMarkAsRead, 100);

  function addEventListeners() {
    window.addEventListener('scroll', throttledMaybeMarkAsRead, { passive: true });
    window.addEventListener('resize', throttledMaybeMarkAsRead, { passive: true });
  }

  function removeEventListeners() {
    window.removeEventListener('scroll', throttledMaybeMarkAsRead);
    window.removeEventListener('resize', throttledMaybeMarkAsRead);
  }

  function readContentRemoteCall(read: boolean) {
    const { fromUsername, postId } = contentRemote;
    const variables = { fromUsername, postId, read };
    const expectedResponse = Object.assign({}, variables, { __typename: 'Post' });

    readContentRemote({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        readContentRemote: expectedResponse,
      },
      update: (store) => {
        const specialQuery = FollowingSpecialFeedCountsQuery;
        const specialData: any = store.readQuery({ query: specialQuery });
        specialData.fetchUserTotalCounts.totalCount += variables.read ? -1 : 1;
        store.writeQuery({ query: specialQuery, data: specialData });

        const query = FollowingFeedCountsQuery;
        const data: any = store.readQuery({ query });
        data.fetchFeedCounts.find((i: Post) => i.fromUsername === fromUsername).count += read ? -1 : 1;
        store.writeQuery({ query, data });
      },
    });
  }

  const keepUnreadCb = (keepUnread: boolean) => {
    if (keepUnread && contentRemote.read) {
      readContentRemoteCall(false);
      setManuallyMarkedAsRead(false);
    }

    setKeepUnread(keepUnread);
  };

  // Make all links open in new tab.
  const decoratedView = contentRemote.view.replace(/<a ([^>]+)/g, '<a $1 target="_blank" rel="noreferrer noopener"');

  return (
    <ItemWrapper className="hw-item">
      <Header contentRemote={contentRemote} />
      <div className="notranslate" dangerouslySetInnerHTML={{ __html: decoratedView }} />
      <Footer contentRemote={contentRemote} keepUnreadCb={keepUnreadCb} />
    </ItemWrapper>
  );
}
