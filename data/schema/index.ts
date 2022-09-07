import { gql } from '@apollo/client';
import userSchema from './user';

// The `_` (underscores) here signify that the queries, mutations, subscriptions will be extended
// by the rest of the schemas. This schema simply ties them all together.
const linkSchema = gql`
  type Echo {
    exampleField: String!
  }

  type Query {
    _: Boolean
    hello: String
    echoExample(str: String!): Echo
  }

  type Mutation {
    _: Boolean
  }

  type Subscription {
    _: Boolean
  }

  scalar Date
`;

const schema = [linkSchema, userSchema];
export default schema;
