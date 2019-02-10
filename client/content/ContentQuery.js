import gql from 'graphql-tag';

export default gql`
  query ContentAndUserQuery($username: String!, $name: String!) {
    fetchContent(username: $username, name: $name) {
      album
      code
      comments_count
      comments_updated
      count
      count_robot
      createdAt
      forceRefresh
      hidden
      name
      section
      style
      template
      thumb
      title
      updatedAt
      username
      view
    }

    fetchPublicUserData(username: $username) {
      description
      title
    }
  }
`;
