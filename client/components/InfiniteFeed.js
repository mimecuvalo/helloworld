import _ from 'lodash';
import React, { useEffect, useState } from 'react';

export default function InfiniteFeed({ children, deduper, fetchMore, queryName }) {
  const [didReachEndOfFeed, setDidReachEndOfFeed] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const maybeLoadMoreContent = () => {
      if (fetchingMore || didReachEndOfFeed) {
        return;
      }

      // We check to see if we're close to the bottom of the feed, three window-fulls of content ahead.
      if (document.documentElement.scrollTop + window.innerHeight * 3 < document.documentElement.scrollHeight) {
        return;
      }

      setOffset(offset + 1);
      setFetchingMore(true);
    };

    const throttledMaybeLoadMoreContent = _.throttle(maybeLoadMoreContent, 100);
    window.addEventListener('scroll', throttledMaybeLoadMoreContent, { passive: true });
    window.addEventListener('resize', throttledMaybeLoadMoreContent, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledMaybeLoadMoreContent);
      window.removeEventListener('resize', throttledMaybeLoadMoreContent);
    };
  }, [fetchingMore, didReachEndOfFeed, offset]);

  useEffect(() => {
    if (!fetchingMore) {
      return;
    }

    fetchMore({
      variables: { offset },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult || !fetchMoreResult[queryName].length) {
          setDidReachEndOfFeed(true);
          return prev;
        }

        setFetchingMore(false);

        const moreResultsWithoutDupes = deduper
          ? deduper(prev[queryName], fetchMoreResult[queryName])
          : fetchMoreResult[queryName];

        return Object.assign({}, prev, {
          [queryName]: [...prev[queryName], ...moreResultsWithoutDupes],
        });
      },
    });
  }, [deduper, fetchMore, fetchingMore, offset, queryName]);

  return <>{children}</>;
}
