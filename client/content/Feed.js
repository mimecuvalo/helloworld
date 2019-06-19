import { F } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import InfiniteFeed from '../components/InfiniteFeed';
import Item from './Item';
import React, { PureComponent } from 'react';

@graphql(
  gql`
    query($username: String!, $section: String!, $name: String!, $offset: Int!) {
      fetchCollectionPaginated(username: $username, section: $section, name: $name, offset: $offset) {
        album
        code
        comments_count
        comments_updated
        count
        count_robot
        createdAt
        updatedAt
        hidden
        name
        order
        redirect
        section
        sort_type
        style
        template
        thumb
        title
        username
        view
        content
      }

      fetchPublicUserData(username: $username) {
        description
        favicon
        logo
        name
        title
      }
    }
  `,
  {
    options: ({ content: { username, section, name }, didFeedLoad }) => ({
      variables: {
        username,
        section,
        name,
        offset: 0,
      },
      fetchPolicy: didFeedLoad ? 'network-only' : 'cache-first',
    }),
  }
)
class Feed extends PureComponent {
  render() {
    if (this.props.data.loading) {
      return null;
    }

    const collection = this.props.data.fetchCollectionPaginated;
    const contentOwner = this.props.data.fetchPublicUserData;

    if (!collection.length) {
      return <F msg="Nothing to read right now!" />;
    }

    return (
      <InfiniteFeed fetchMore={this.props.data.fetchMore} queryName="fetchCollectionPaginated">
        {collection.map(item => (
          <Item key={item.name} content={item} contentOwner={contentOwner} isFeed={true} />
        ))}
      </InfiniteFeed>
    );
  }
}

export default Feed;
