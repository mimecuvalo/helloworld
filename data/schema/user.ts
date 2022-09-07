import { gql } from '@apollo/client';

export default gql`
  type User {
    username: String!
    email: String!
  }

  extend type Query {
    users: [User]
  }

  extend type Mutation {
    createUser(username: String!, email: String!): User
  }
`;
