import _ from 'lodash';
import classNames from 'classnames';
import FollowingFeedCountsQuery from './FollowingFeedCountsQuery';
import FollowingSpecialFeedCountsQuery from './FollowingSpecialFeedCountsQuery';
import Footer from './Footer';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import Header from './Header';
import React, { Component } from 'react';
import styles from './Item.module.css';

@graphql(gql`
  mutation readContentRemote($from_user: String!, $post_id: String!, $read: Boolean!) {
    readContentRemote(from_user: $from_user, post_id: $post_id, read: $read) {
      from_user
      post_id
      read
    }
  }
`)
class Item extends Component {
  constructor(props) {
    super(props);

    this.state = {
      keepUnread: false,
    };

    this.item = React.createRef();
    this.throttledMaybeMarkAsRead = _.throttle(this.maybeMarkAsRead, 100);
  }

  componentDidMount() {
    this.addEventListeners();
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  addEventListeners() {
    window.addEventListener('scroll', this.throttledMaybeMarkAsRead, { passive: true });
    window.addEventListener('resize', this.throttledMaybeMarkAsRead, { passive: true });
  }

  removeEventListeners() {
    window.removeEventListener('scroll', this.throttledMaybeMarkAsRead);
    window.removeEventListener('resize', this.throttledMaybeMarkAsRead);
  }

  maybeMarkAsRead = () => {
    if (!this.state.keepUnread && this.item.current && this.item.current.getBoundingClientRect().top < 5) {
      this.removeEventListeners();

      this.readContentRemote(true);
    }
  };

  async readContentRemote(read) {
    const { from_user, post_id } = this.props.contentRemote;
    const variables = { from_user, post_id, read };
    const expectedResponse = Object.assign({}, variables, { __typename: 'ContentRemote' });

    await this.props.mutate({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        readContentRemote: expectedResponse,
      },
      update: (store, { data: { readContentRemote } }) => {
        const specialQuery = FollowingSpecialFeedCountsQuery;
        const specialData = store.readQuery({ query: specialQuery });
        specialData.fetchUserTotalCounts.totalCount += read ? -1 : 1;
        store.writeQuery({ query: specialQuery, data: specialData });

        const query = FollowingFeedCountsQuery;
        const data = store.readQuery({ query });
        data.fetchFeedCounts.find(i => i.from_user === from_user).count += read ? -1 : 1;
        store.writeQuery({ query, data });
      },
    });
  }

  keepUnreadCb = keepUnread => {
    if (keepUnread && this.props.contentRemote.read) {
      this.readContentRemote(false);
      this.addEventListeners();
    }

    this.setState({ keepUnread });
  };

  render() {
    const contentRemote = this.props.contentRemote;

    return (
      <section ref={this.item} className={classNames('hw-item', styles.item)}>
        <Header contentRemote={contentRemote} />
        <div dangerouslySetInnerHTML={{ __html: contentRemote.view }} />
        <Footer contentRemote={contentRemote} keepUnreadCb={this.keepUnreadCb} />
      </section>
    );
  }
}

export default Item;
