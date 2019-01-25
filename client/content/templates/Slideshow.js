import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import Simple from './Simple';

@graphql(
  gql`
    query($username: String!, $section: String!, $name: String!) {
      fetchCollection(username: $username, section: $section, name: $name) {
        album
        name
        section
        title
        username
        view
      }
    }
  `,
  {
    options: ({ content: { username, section, name } }) => ({
      variables: {
        username,
        section,
        name,
      },
    }),
  }
)
class Slideshow extends PureComponent {
  render() {
    const collection = this.props.data.fetchCollection;

    return (
      <>
        {collection.map(item => (
          <Simple key={item.name} content={item} />
        ))}
      </>
    );
  }
}

export default Slideshow;
