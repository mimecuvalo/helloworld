import _ from 'lodash';
import React, { PureComponent } from 'react';

class InfiniteFeed extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      didReachEndOfFeed: false,
      fetchingMore: false,
      offset: 0,
    };

    React.createRef(); // XXX(mime): import React lint error above since we're just using <> elements below :-/
    this.throttledMaybeLoadMoreContent = _.throttle(this.maybeLoadMoreContent, 100);
  }

  componentDidMount() {
    window.addEventListener('scroll', this.throttledMaybeLoadMoreContent, { passive: true });
    window.addEventListener('resize', this.throttledMaybeLoadMoreContent, { passive: true });
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.throttledMaybeLoadMoreContent);
    window.removeEventListener('resize', this.throttledMaybeLoadMoreContent);
  }

  maybeLoadMoreContent = () => {
    if (this.state.fetchingMore || this.state.didReachEndOfFeed) {
      return;
    }

    // We check to see if we're close to the bottom of the feed, three window-fulls of content ahead.
    if (document.documentElement.scrollTop + window.innerHeight * 3 < document.documentElement.scrollHeight) {
      return;
    }

    const queryName = this.props.queryName;
    this.setState({ fetchingMore: true, offset: this.state.offset + 1 }, () => {
      this.props.fetchMore({
        variables: {
          offset: this.state.offset,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult || !fetchMoreResult[queryName].length) {
            this.setState({ didReachEndOfFeed: true });
            return prev;
          }

          this.setState({ fetchingMore: false });

          const moreResultsWithoutDupes = this.props.deduper
            ? this.props.deduper(prev[queryName], fetchMoreResult[queryName])
            : fetchMoreResult[queryName];

          return Object.assign({}, prev, {
            [queryName]: [...prev[queryName], ...moreResultsWithoutDupes],
          });
        },
      });
    });
  };

  render() {
    return <>{this.props.children}</>;
  }
}

export default InfiniteFeed;
