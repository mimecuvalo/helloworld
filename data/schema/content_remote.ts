import { gql } from '@apollo/client';

export default gql`
  interface ContentRemote {
    avatar: String
    createdAt: Date!
    deleted: Boolean!
    favorited: Boolean!
    fromUsername: String
    localContentName: String
    postId: String!
    toUsername: String!
    type: String!
    username: String!
  }

  type Post implements ContentRemote {
    avatar: String
    commentUser: String
    commentsCount: Int!
    commentsUpdated: Date
    createdAt: Date!
    creator: String
    deleted: Boolean!
    favorited: Boolean!
    fromUsername: String
    isSpam: Boolean!
    link: String!
    localContentName: String
    postId: String!
    read: Boolean!
    thread: String
    title: String!
    toUsername: String!
    type: String!
    updatedAt: Date
    username: String!
    view: String!
  }

  type Comment implements ContentRemote {
    avatar: String
    creator: String
    content: String
    createdAt: Date!
    deleted: Boolean!
    favorited: Boolean!
    fromUsername: String
    link: String!
    localContentName: String
    postId: String!
    toUsername: String!
    type: String!
    username: String!
    view: String!
  }

  type Favorite implements ContentRemote {
    avatar: String
    createdAt: Date!
    deleted: Boolean!
    favorited: Boolean!
    fromUsername: String
    localContentName: String
    postId: String!
    toUsername: String!
    type: String!
    username: String!
  }

  type UserCounts {
    commentsCount: Int!
    favoritesCount: Int!
    totalCount: Int!
  }

  type FeedCount {
    fromUsername: String!
    count: Int!
  }

  extend type Query {
    allContentRemote: [ContentRemote!]!
    fetchContentRemote(id: Int!): ContentRemote
    fetchContentRemotePaginated(
      profileUrlOrSpecialFeed: String!
      offset: Int!
      query: String
      shouldShowAllItems: Boolean
    ): [Post!]!
    fetchUserTotalCounts: UserCounts!
    fetchFeedCounts: [FeedCount!]!
    fetchCommentsRemote(username: String, name: String): [Comment!]!
    fetchFavoritesRemote(username: String, name: String): [Favorite!]!
  }

  extend type Mutation {
    postComment(username: String!, name: String!, content: String!): Comment!
    favoriteContentRemote(fromUsername: String!, postId: String!, type: String!, favorited: Boolean!): ContentRemote!
    deleteContentRemote(
      fromUsername: String!
      postId: String!
      localContentName: String!
      type: String!
      deleted: Boolean!
    ): ContentRemote!
    markAllContentInFeedAsRead(fromUsername: String!): FeedCount!
    markAllFeedsAsRead: FeedCount!
    readContentRemote(fromUsername: String!, postId: String!, read: Boolean!): Post!
  }
`;
