import { Post, UserRemotePublic } from 'data/graphql-generated';
import { gql, useMutation } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';

import FollowingFeedCountsQuery from './FollowingFeedCountsQuery';
import FollowingSpecialFeedCountsQuery from './FollowingSpecialFeedCountsQuery';
import Footer from './Footer';
import Header from './Header';
import debounce from 'lodash/debounce';
import { styled } from 'components';

const StyledItem = styled('article', { label: 'DashboardStyledItem' })`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const View = styled('div', { label: 'DashboardView' })`
  flex: 1;
  padding: ${(props) => props.theme.spacing(0, 1)};
  text-wrap-style: balance;

  & img,
  & figure {
    margin: ${(props) => props.theme.spacing(0, -1)};
  }
`;

const READ_CONTENT_REMOTE = gql`
  mutation readContentRemote($fromUsername: String!, $postId: String!, $read: Boolean!) {
    readContentRemote(fromUsername: $fromUsername, postId: $postId, read: $read) {
      fromUsername
      postId
      read
    }
  }
`;

export default function Item({ contentRemote, userRemote }: { contentRemote: Post; userRemote: UserRemotePublic }) {
  const [readContentRemote] = useMutation(READ_CONTENT_REMOTE);
  const [keepUnread, setKeepUnread] = useState(false);
  const [manuallyMarkedAsRead, setManuallyMarkedAsRead] = useState(contentRemote.read);
  const item = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!manuallyMarkedAsRead) {
      addEventListeners();
    } else {
      removeEventListeners();
    }

    return () => removeEventListeners();
  });

  const maybeMarkAsRead = () => {
    const doc = document.documentElement;
    const bottomOfFeed = doc.scrollTop + window.innerHeight >= doc.scrollHeight - 50;
    if (
      !manuallyMarkedAsRead &&
      !keepUnread &&
      item.current &&
      (item.current.getBoundingClientRect().top < -50 || bottomOfFeed)
    ) {
      removeEventListeners();
      setManuallyMarkedAsRead(true);
      readContentRemoteCall(true);
    }
  };
  const debouncedMaybeMarkAsRead = debounce(maybeMarkAsRead, 100);

  function addEventListeners() {
    window.addEventListener('scroll', debouncedMaybeMarkAsRead, { passive: true });
    window.addEventListener('resize', debouncedMaybeMarkAsRead, { passive: true });
  }

  function removeEventListeners() {
    window.removeEventListener('scroll', debouncedMaybeMarkAsRead);
    window.removeEventListener('resize', debouncedMaybeMarkAsRead);
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
        const specialData: any = Object.assign({}, store.readQuery({ query: specialQuery }));
        specialData.fetchUserTotalCounts = Object.assign({}, specialData.fetchUserTotalCounts);
        specialData.fetchUserTotalCounts.totalCount += variables.read ? -1 : 1;
        store.writeQuery({ query: specialQuery, data: specialData });

        const query = FollowingFeedCountsQuery;
        const data: any = Object.assign({}, store.readQuery({ query }));
        data.fetchFeedCounts = data.fetchFeedCounts.slice(0).map((i: Post) => Object.assign({}, i));
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
    <StyledItem ref={item}>
      <Header contentRemote={contentRemote} manuallyMarkedAsRead={manuallyMarkedAsRead} />
      <View className="notranslate" dangerouslySetInnerHTML={{ __html: decoratedView }} />
      <Footer contentRemote={contentRemote} userRemote={userRemote} keepUnreadCb={keepUnreadCb} />
    </StyledItem>
  );
}
