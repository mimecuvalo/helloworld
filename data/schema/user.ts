import { gql } from '@apollo/client';

export default gql`
  type UserPrivate {
    id: Int!
    username: String!
    name: String!
    email: String!
    title: String!
    description: String
    license: String
    googleAnalytics: String
    magicKey: String!
    favicon: String
    logo: String
    theme: String!
    viewport: String
    sidebarHtml: String
    superuser: Boolean!
    hostname: String
    privateKey: String!
  }

  type UserPublic {
    username: String!
    name: String!
    email: String!
    title: String!
    description: String
    license: String
    googleAnalytics: String
    magicKey: String!
    favicon: String
    logo: String
    theme: String!
    viewport: String
    sidebarHtml: String
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
