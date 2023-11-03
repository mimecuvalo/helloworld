import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

import contentRemoteResolvers from './content_remote';
import contentResolvers from './content';
import userRemoteResolvers from './user_remote';
import userResolvers from './user';

const baseResolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value: unknown) {
      return new Date(value as string); // value from the client
    },
    serialize(value: unknown) {
      return (value as Date).getTime(); // value sent to the client
    },
    parseLiteral(ast: ValueNode) {
      if (ast.kind === Kind.INT) {
        return new Date(parseInt(ast.value || '', 10)); // ast value is always in string format
      }
      return null;
    },
  }),

  Query: {
    // Just spits out what it's given as a test example.
    // @ts-ignore figure out later
    async echoExample(parent, { str }) {
      return { exampleField: str };
    },

    hello: () => 'GraphQL',
  },
};

const resolvers = [baseResolvers, contentResolvers, contentRemoteResolvers, userRemoteResolvers, userResolvers];
export default resolvers;
