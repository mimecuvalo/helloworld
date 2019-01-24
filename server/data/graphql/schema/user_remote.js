import { gql } from 'apollo-server-express';

// Keep in sync with both models/user_remote.js and migrations/[date]-create-user-remote.js
export default gql`
  type UserRemotePrivate {
    id: ID!
    local_username: String!
    username: String!
    name: String!
    magic_key: String!
    profile_url: String!
    salmon_url: String!
    webmention_url: String!
    feed_url: String!
    hub_url: String!
    follower: Boolean!
    following: Boolean!
    avatar: String!
    favicon: String!
    order: Int!
    sort_type: String!
  }

  type UserRemotePublic {
    local_username: String!
    username: String!
    name: String!
    profile_url: String!
    salmon_url: String!
    webmention_url: String!
    feed_url: String!
    hub_url: String!
    avatar: String!
    favicon: String!
    sort_type: String!
  }

  extend type Query {
    allUsersRemote: [UserRemotePrivate]
    fetchUserRemote(id: Int!): UserRemotePrivate
    fetchFollowers: [UserRemotePublic]
    fetchFollowing: [UserRemotePublic]
  }
`;
