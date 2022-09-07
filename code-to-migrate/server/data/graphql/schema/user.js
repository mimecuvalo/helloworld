import { gql } from 'apollo-server-express';

// Keep in sync with both models/user.js and migrations/[date]-create-user.js
export default gql`
  type UserPrivate {
    username: String!
    name: String!
    email: String!
    title: String!
    description: String
    license: String
    google_analytics: String
    magic_key: String!
    favicon: String
    logo: String
    theme: String!
    viewport: String
    sidebar_html: String
    superuser: Boolean!
    hostname: String
    private_key: String!
  }

  type UserPublic {
    username: String!
    name: String!
    email: String!
    title: String!
    description: String
    license: String
    google_analytics: String
    magic_key: String!
    favicon: String
    logo: String
    theme: String!
    viewport: String
    sidebar_html: String
  }

  extend type Query {
    fetchAllUsers: [UserPrivate!]!
    fetchUser(id: Int!): UserPrivate
    fetchPublicUserData(username: String): UserPublic
    fetchPublicUserDataHead(username: String): UserPublic
    fetchPublicUserDataSearch(username: String): UserPublic
  }

  extend type Mutation {
    createUser(username: String!, email: String!): UserPrivate
  }
`;
