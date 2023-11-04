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
      sidebarHtml
      title
      theme
      viewport
      license
      googleAnalytics
    }

    fetchSiteMap(username: $username) {
      album
      forceRefresh
      hidden
      name
      section
      title
      username
    }

    fetchContentNeighbors(username: $username, name: $name) {
      first {
        album
        forceRefresh
        hidden
        name
        section
        title
        username
      }
      last {
        album
        forceRefresh
        hidden
        name
        section
        title
        username
      }
      next {
        album
        forceRefresh
        hidden
        name
        section
        title
        username
        prefetchImages
      }
      prev {
        album
        forceRefresh
        hidden
        name
        section
        title
        username
        prefetchImages
      }
      top {
        album
        forceRefresh
        hidden
        name
        section
        title
        username
        template
      }
    }
  }
`;
