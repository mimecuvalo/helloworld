import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import Item from './Item';
import React, { PureComponent } from 'react';

@graphql(gql`
  query ($username: String!, $section: String!, $name: String!) {
    fetchCollectionPaginated(username: $username, section: $section, name: $name) {
      username
      section
      album
      name
      template
      sort_type
      redirect
      hidden
      title
      date_created
      date_updated
      thumb
      order
      count
      count_robot
      comments_count
      comments_updated
      style
      code
      view
    }
  }
`, {
  options: ({ content: { username, section, name } }) => ({
    variables: {
      username,
      section,
      name,
    }
  })
})
class Feed extends PureComponent {
  render() {
    const collection = this.props.data.fetchCollectionPaginated;

    return (
      <>
        {collection.map(item => <Item key={item.name} content={item} /> )}
      </>
    );
  }
}

export default Feed;