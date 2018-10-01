import { gql } from 'apollo-server-express';
import userSchema from './user';

// The `_` (underscores) here signify that the queries, mutations, subscriptions will be extended
// by the rest of the schemas. This schema simply ties them all together.
const linkSchema = gql`
  type Query {
    _: Boolean
    hello: String
  }

  type Mutation {
    _: Boolean
  }

  type Subscription {
    _: Boolean
  }
`;

export default [linkSchema, userSchema];
