import { gql, useMutation } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';

import FollowingFeedCountsQuery from './FollowingFeedCountsQuery';
import FollowingSpecialFeedCountsQuery from './FollowingSpecialFeedCountsQuery';
import Footer from './Footer';
import Header from './Header';
import { ItemWrapper } from 'components/content/Feed';
import throttle from 'lodash/throttle';

const READ_CONTENT_REMOTE = gql`
  mutation readContentRemote($from_user: String!, $post_id: String!, $read: Boolean!) {
    readContentRemote(from_user: $from_user, post_id: $post_id, read: $read) {
      from_user
      post_id
      read
    }
  }
`;

export default function Item({ contentRemote }: { contentRemote: ContentRemote }) {
  const [readContentRemote] = useMutation(READ_CONTENT_REMOTE);
  const [keepUnread, setKeepUnread] = useState(false);
  const [manuallyMarkedAsRead, setManuallyMarkedAsRead] = useState(contentRemote.read);
  const item = useRef(null);

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

  function readContentRemoteCall(read) {
    const { from_user, post_id } = contentRemote;
    const variables = { from_user, post_id, read };
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
        data.fetchFeedCounts.find((i) => i.from_user === from_user).count += read ? -1 : 1;
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
    <ItemWrapper ref={item} className="hw-item">
      <Header contentRemote={contentRemote} />
      <div className="notranslate" dangerouslySetInnerHTML={{ __html: decoratedView }} />
      <Footer contentRemote={contentRemote} keepUnreadCb={keepUnreadCb} />
    </ItemWrapper>
  );
}
