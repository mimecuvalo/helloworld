import { gql } from 'apollo-server-express';

// Keep in sync with both models/user_remote.js and migrations/[date]-create-user-remote.js
export default gql`
  type User_Remote {
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

  extend type Query {
    allUsersRemote: [User_Remote]
    fetchUserRemote(id: Int!): User_Remote
  }
`;
