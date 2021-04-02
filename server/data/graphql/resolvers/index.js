import contentResolvers from './content';
import contentRemoteResolvers from './content_remote';
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';
import userResolvers from './user';
import userRemoteResolvers from './user_remote';

const exampleResolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10); // ast value is always in string format
      }
      return null;
    },
  }),

  Query: {
    hello: () => 'GraphQL',
  },
};

const resolvers = [exampleResolvers, contentResolvers, contentRemoteResolvers, userRemoteResolvers, userResolvers];
export default resolvers;
