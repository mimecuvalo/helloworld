import { gql } from 'apollo-server-express';

// Keep in sync with both models/content.js and migrations/[date]-create-content.js
export default gql`
  scalar Date

  type Content {
    id: ID!
    username: String!
    section: String!
    album: String!
    name: String!
    template: String!
    sort_type: String!
    redirect: ID!
    hidden: Boolean!
    title: String!
    date_created: Date!
    date_updated: Date!
    thumb: String!
    order: Int!
    count: Int!
    count_robot: Int!
    comments_count: Int!
    comments_updated: Date
    favorited: Boolean!
    thread: String!
    thread_user: String!
    avatar: String!
    style: String!
    code: String!
    view: String!
  }

  type ContentMetaInfo {
    username: String!
    section: String!
    album: String!
    name: String!
    title: String!
    hidden: Boolean!
  }

  type Neighbors {
    first: ContentMetaInfo
    prev: ContentMetaInfo
    top: ContentMetaInfo
    next: ContentMetaInfo
    last: ContentMetaInfo
  }

  extend type Query {
    allContent: [Content]
    fetchContent(username: String, name: String): Content
    fetchContentNeighbors(username: String, section: String, album: String, name: String): Neighbors
    fetchCollection(username: String!, section: String!, name: String!): [Content]
    fetchCollectionPaginated(username: String!, section: String!, name: String!): [Content]
    fetchCollectionLatest(username: String!, section: String!, name: String!): Content
    fetchSiteMap(username: String!): [ContentMetaInfo]
  }
`;
