import _ from 'lodash';
import classNames from 'classnames';
import { createUseStyles } from 'react-jss';
import FollowingFeedCountsQuery from './FollowingFeedCountsQuery';
import FollowingSpecialFeedCountsQuery from './FollowingSpecialFeedCountsQuery';
import Footer from './Footer';
import gql from 'graphql-tag';
import Header from './Header';
import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/react-hooks';

const useStyles = createUseStyles({
  /* Reset some sane defaults for web content. Taken from Chrome's User Agent defaults. */
  item: {
    clear: 'both',
    zoom: '0.75',
    marginRight: '32px',
    flex: '0 1',
    maxHeight: '90vh',
    minWidth: '34vw',
    overflowY: 'scroll',
    padding: '6px',
    paddingBottom: '0',
    marginBottom: '32px',
    boxShadow: '1px 1px 2px #ccc',
    transition: 'box-shadow 100ms',

    '&:hover': {
      boxShadow: '1px 1px 2px #999',
    },
    '& p': {
      marginBlockStart: '1em',
      marginBlockEnd: '1em',
      marginInlineStart: '0px',
      marginInlineEnd: '0px',
    },
    '& ul, & ol, & blockquote': {
      marginBlockStart: '1em',
      marginBlockEnd: '1em',
      marginInlineStart: '0px',
      marginInlineEnd: '0px',
      paddingInlineStart: '20px',
    },
    '& blockquote': {
      borderLeft: '1px solid #666',
    },
    '& a': {
      wordWrap: 'break-word',
    },
    '& pre': {
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
    },
    '& img': {
      maxWidth: '100%',
      height: 'auto',
    },
    '& iframe': {
      border: '0',
      maxWidth: '100%',
    },
  },
});

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
  const [readContentRemote] = useMutation(READ_CONTENT_REMOTE);
  const [keepUnread, setKeepUnread] = useState(false);
  const [manuallyMarkedAsRead, setManuallyMarkedAsRead] = useState(props.contentRemote.read);
  const item = useRef(null);
  const styles = useStyles();

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
        data.fetchFeedCounts.find(i => i.from_user === from_user).count += read ? -1 : 1;
        store.writeQuery({ query, data });
      },
    });
  }

  const keepUnreadCb = keepUnread => {
    if (keepUnread && props.contentRemote.read) {
      readContentRemoteCall(false);
      setManuallyMarkedAsRead(false);
    }

    setKeepUnread(keepUnread);
  };

  const contentRemote = props.contentRemote;

  // Make all links open in new tab.
  const decoratedView = contentRemote.view.replace(/<a ([^>]+)/g, '<a $1 target="_blank" rel="noreferrer noopener"');

  return (
    <article ref={item} className={classNames('hw-item', styles.item)}>
      <Header contentRemote={contentRemote} />
      <div className="notranslate" dangerouslySetInnerHTML={{ __html: decoratedView }} />
      <Footer contentRemote={contentRemote} keepUnreadCb={keepUnreadCb} getEditor={props.getEditor} />
    </article>
  );
}
