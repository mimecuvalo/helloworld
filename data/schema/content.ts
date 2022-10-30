import { gql } from '@apollo/client';

export default gql`
  type Content {
    username: String!
    section: String!
    album: String!
    name: String!
    template: String!
    sortType: String
    redirect: Int!
    hidden: Boolean!
    title: String!
    createdAt: Date!
    updatedAt: Date!
    thumb: String!
    order: Int!
    count: Int!
    countRobot: Int!
    commentsCount: Int!
    commentsUpdated: Date
    favorited: Boolean!
    thread: String
    threadUser: String
    avatar: String
    style: String!
    code: String!
    view: String!
    content: String!
    forceRefresh: Boolean # If content contains style/code we can't do ajax navigation.
    prefetchImages: [String!]
    externalLink: String # If we have a direct link to an external site.
  }

  type ContentMetaInfo {
    username: String!
    section: String!
    album: String!
    name: String!
    title: String!
    thumb: String!
    hidden: Boolean!
    template: String!
    forceRefresh: Boolean! # If content contains style/code we can't do ajax navigation.
    prefetchImages: [String!] # Images to download on client to make loading faster.
    externalLink: String # If we have a direct link to an external site.
  }

  type SearchContentMetaInfo {
    username: String!
    section: String!
    album: String!
    name: String!
    title: String!
    thumb: String!
    hidden: Boolean!
    template: String!
    forceRefresh: Boolean! # If content contains style/code we can't do ajax navigation.
    preview: String!
  }

  type Neighbors {
    first: ContentMetaInfo
    prev: ContentMetaInfo
    top: ContentMetaInfo
    next: ContentMetaInfo
    last: ContentMetaInfo
  }

  extend type Query {
    allContent: [Content!]!
    fetchContent(username: String, name: String): Content
    fetchContentNeighbors(username: String, name: String): Neighbors
    fetchCollection(username: String!, section: String!, album: String!, name: String!): [ContentMetaInfo!]!
    fetchCollectionPaginated(username: String!, section: String!, name: String!, offset: Int!): [Content!]!
    fetchCollectionLatest(username: String!, section: String!, name: String!): Content
    fetchSiteMap(username: String!): [ContentMetaInfo!]!
    searchContent(username: String!, query: String!): [SearchContentMetaInfo!]!
  }

  extend type Mutation {
    saveContent(
      name: String!
      hidden: Boolean!
      title: String!
      thumb: String!
      style: String!
      code: String!
      content: String!
    ): Content!
    postContent(
      section: String!
      album: String!
      name: String!
      title: String!
      hidden: Boolean!
      thumb: String!
      style: String!
      code: String!
      content: String!
    ): Content!
    deleteContent(name: String!): Boolean!
  }
`;
