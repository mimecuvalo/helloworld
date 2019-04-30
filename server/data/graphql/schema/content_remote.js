import { gql } from 'apollo-server-express';

// Keep in sync with both models/content_remote.js and migrations/[date]-create-content-remote.js
export default gql`
  interface ContentRemote {
    avatar: String
    createdAt: Date!
    deleted: Boolean!
    favorited: Boolean!
    from_user: String
    post_id: String!
    type: String!
    username: String!
  }

  type Post implements ContentRemote {
    to_username: String!
    local_content_name: String
    from_user: String
    comment_user: String
    username: String!
    creator: String
    avatar: String
    title: String!
    post_id: String!
    link: String!
    createdAt: Date!
    updatedAt: Date
    comments_updated: Date
    comments_count: Int!
    thread: String
    type: String!
    favorited: Boolean!
    read: Boolean!
    is_spam: Boolean!
    deleted: Boolean!
    view: String!
  }

  type Comment implements ContentRemote {
    avatar: String
    createdAt: Date!
    deleted: Boolean!
    favorited: Boolean!
    from_user: String
    link: String!
    post_id: String!
    type: String!
    username: String!
    view: String!
  }

  type Favorite implements ContentRemote {
    avatar: String!
    createdAt: Date!
    deleted: Boolean!
    favorited: Boolean!
    from_user: String
    post_id: String!
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
    favoriteContentRemote(from_user: String, post_id: String!, type: String!, favorited: Boolean!): ContentRemote!
    deleteContentRemote(from_user: String, post_id: String!, type: String!, deleted: Boolean!): ContentRemote!
    markAllContentInFeedAsRead(from_user: String!): FeedCount!
    readContentRemote(from_user: String!, post_id: String!, read: Boolean!): Post!
  }
`;
