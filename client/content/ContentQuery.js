import gql from 'graphql-tag';

export default gql`
  query ContentAndUserQuery($username: String!, $name: String!) {
    fetchContent(username: $username, name: $name) {
      album
      code
      comments_count
      comments_updated
      content
      count
      count_robot
      createdAt
      forceRefresh
      hidden
      name
      section
      style
      template
      thread
      thumb
      title
      updatedAt
      username
      view
    }

    fetchCommentsRemote(username: $username, name: $name) {
      avatar
      content
      deleted
      favorited
      from_user
      link
      local_content_name
      post_id
      type
      username
      view
    }

    fetchFavoritesRemote(username: $username, name: $name) {
      avatar
      from_user
      local_content_name
      post_id
      type
      username
    }

    fetchPublicUserData(username: $username) {
      description
      title
    }
  }
`;
