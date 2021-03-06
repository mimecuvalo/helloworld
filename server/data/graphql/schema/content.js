import { gql } from 'apollo-server-express';

// Keep in sync with both models/content.js and migrations/[date]-create-content.js
export default gql`
  type Content {
    username: String!
    section: String!
    album: String!
    name: String!
    template: String
    sort_type: String
    redirect: ID!
    hidden: Boolean!
    title: String!
    createdAt: Date!
    updatedAt: Date!
    thumb: String!
    order: Int!
    count: Int!
    count_robot: Int!
    comments_count: Int!
    comments_updated: Date
    favorited: Boolean!
    thread: String
    thread_user: String
    avatar: String
    style: String!
    code: String!
    view: String!
    content: String!
    forceRefresh: Boolean # If content contains style/code we can't do ajax navigation.
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
    fetchContentHead(username: String, name: String): Content
    fetchContentNeighbors(username: String, section: String, album: String, name: String): Neighbors!
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
