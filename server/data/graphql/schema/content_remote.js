import { gql } from 'apollo-server-express';

// Keep in sync with both models/content_remote.js and migrations/[date]-create-content-remote.js
export default gql`
  interface ContentRemote {
    avatar: String
    createdAt: Date!
    deleted: Boolean!
    favorited: Boolean!
    from_user: String
    local_content_name: String
    post_id: String!
    to_username: String!
    type: String!
    username: String!
  }

  type Post implements ContentRemote {
    avatar: String
    comment_user: String
    comments_count: Int!
    comments_updated: Date
    createdAt: Date!
    creator: String
    deleted: Boolean!
    favorited: Boolean!
    from_user: String
    is_spam: Boolean!
    link: String!
    local_content_name: String
    post_id: String!
    read: Boolean!
    thread: String
    title: String!
    to_username: String!
    type: String!
    updatedAt: Date
    username: String!
    view: String!
  }

  type Comment implements ContentRemote {
    avatar: String
    content: String
    createdAt: Date!
    deleted: Boolean!
    favorited: Boolean!
    from_user: String
    link: String!
    local_content_name: String
    post_id: String!
    to_username: String!
    type: String!
    username: String!
    view: String
  }

  type Favorite implements ContentRemote {
    avatar: String
    createdAt: Date!
    deleted: Boolean!
    favorited: Boolean!
    from_user: String
    local_content_name: String
    post_id: String!
    to_username: String!
    type: String!
    username: String!
  }

  type UserCounts {
    commentsCount: Int!
    favoritesCount: Int!
    totalCount: Int!
  }

  type FeedCount {
    from_user: String!
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
    favoriteContentRemote(from_user: String, post_id: String!, type: String!, favorited: Boolean!): ContentRemote!
    deleteContentRemote(
      from_user: String
      post_id: String!
      local_content_name: String!
      type: String!
      deleted: Boolean!
    ): ContentRemote!
    markAllContentInFeedAsRead(from_user: String!): FeedCount!
    markAllFeedsAsRead: FeedCount!
    readContentRemote(from_user: String!, post_id: String!, read: Boolean!): Post!
  }
`;
