import { gql } from 'apollo-server-express';

// Keep in sync with both models/user_remote.js and migrations/[date]-create-user-remote.js
export default gql`
  type UserRemotePrivate {
    local_username: String!
    username: String!
    name: String!
    profile_url: String!
    salmon_url: String
    activitypub_actor_url: String
    activitypub_inbox_url: String
    webmention_url: String
    magic_key: String
    follower: Boolean!
    following: Boolean!
    feed_url: String!
    hub_url: String
    avatar: String!
    favicon: String
    sort_type: String
    order: Int!
  }

  type UserRemotePublic {
    local_username: String!
    username: String!
    name: String!
    profile_url: String!
    salmon_url: String
    activitypub_actor_url: String
    activitypub_inbox_url: String
    webmention_url: String
    magic_key: String
    follower: Boolean!
    following: Boolean!
    feed_url: String!
    hub_url: String
    avatar: String!
    favicon: String
    sort_type: String
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
