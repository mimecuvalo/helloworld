import { gql } from 'apollo-server-express';

const commonFields = `
  local_username: String!
  username: String!
  name: String!
  profile_url: String!
  salmon_url: String
  webmention_url: String
  feed_url: String!
  hub_url: String
  avatar: String!
  favicon: String
  sort_type: String
`;

// Keep in sync with both models/user_remote.js and migrations/[date]-create-user-remote.js
export default gql`
  type UserRemotePrivate {
    ${commonFields}
    magic_key: String
    follower: Boolean!
    following: Boolean!
    order: Int!
  }

  type UserRemotePublic {
    ${commonFields}
  }

  extend type Query {
    allUsersRemote: [UserRemotePrivate!]!
    fetchUserRemote(id: Int!): UserRemotePrivate
    fetchFollowers: [UserRemotePublic!]!
    fetchFollowing: [UserRemotePublic!]!
  }

  extend type Mutation {
    createUserRemote(profile_url: String!): UserRemotePublic
    toggleSortFeed(profile_url: String!, current_sort_type: String!): UserRemotePublic!
    destroyFeed(profile_url: String!): Boolean!
  }
`;
