import { gql } from 'apollo-server-express';

// Keep in sync with both models/user.js and migrations/[date]-create-user.js
export default gql`
  type User {
    id: Int!
    username: String!
    email: String!
  }

  extend type Query {
    allUsers: [User]
    fetchUser(id: Int!): User
  }

  extend type Mutation {
    login(email: String!): String
    createUser(username: String!, email: String!): User
  }
`;
