import userResolvers from './user';

const exampleResolvers = {
  Query: {
    hello: () => 'GraphQL',
  },
};

export default [exampleResolvers, userResolvers];
