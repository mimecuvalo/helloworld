import { gql } from '@apollo/client';

export default gql`
  query ContentAndUser($username: String!, $name: String!) {
    fetchContent(username: $username, name: $name) {
      album
      code
      commentsCount
      commentsUpdated
      content
      count
      countRobot
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
      creator
      content
      deleted
      favorited
      fromUsername
      link
      localContentName
      postId
      type
      username
      view
    }

    fetchFavoritesRemote(username: $username, name: $name) {
      avatar
      fromUsername
      localContentName
      postId
      type
      username
    }

    fetchPublicUserData(username: $username) {
      username
      description
      favicon
      logo
      name
      title
      theme
      viewport
    }
  }
`;
