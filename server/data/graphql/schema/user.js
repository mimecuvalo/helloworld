import { gql } from 'apollo-server-express';

// Keep in sync with both models/user.js and migrations/[date]-create-user.js
export default gql`
  type User {
    id: ID!
    username: String!
    name: String!
    email: String!
    superuser: Boolean!
    title: String!
    description: String
    hostname: String
    license: String
    google_analytics: String
    favicon: String
    logo: String
    theme: String!
    magic_key: String!
    private_key: String!
  }

  extend type Query {
    allUsers: [User]
    fetchUser(id: Int!): User
  }

  extend type Mutation {
    createUser(username: String!, email: String!): User
  }
`;
