import React, { Component } from 'react';

class InfiniteFeed extends Component {
  constructor(props) {
    super(props);

    this.state = {
      didReachEndOfFeed: false,
      fetchingMore: false,
      offset: 0,
    };

    React.createRef(); // XXX(mime): import React lint error above since we're just using <> elements below :-/
  }

  componentDidMount() {
    window.addEventListener('scroll', this.maybeLoadMoreContent, { passive: true });
    window.addEventListener('resize', this.maybeLoadMoreContent, { passive: true });
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.maybeLoadMoreContent);
    window.removeEventListener('resize', this.maybeLoadMoreContent);
  }

  // componentDidUpdate(prevProps) {
  //   if (prevProps.userRemote !== this.props.userRemote || prevProps.specialFeed !== this.props.specialFeed) {
  //     this.setState({
  //       didReachEndOfFeed: false,
  //       fetchingMore: false,
  //       offset: 0,
  //     });
  //   }
  // }

  maybeLoadMoreContent = () => {
    if (this.state.fetchingMore || this.state.didReachEndOfFeed) {
      return;
    }

    // We check to see if we're close to the bottom of the feed, three window-fulls of content ahead.
    if (document.documentElement.scrollTop + window.innerHeight * 5 < document.documentElement.scrollHeight) {
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

          return Object.assign({}, prev, {
            [queryName]: [...prev[queryName], ...fetchMoreResult[queryName]],
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
