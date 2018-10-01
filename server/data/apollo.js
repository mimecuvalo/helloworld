import { ApolloServer } from 'apollo-server-express';
import models from './models';
import typeDefs from './graphql/schema';
import resolvers from './graphql/resolvers';

/**
 * The main entry point for our Apollo/GraphQL server.
 * Works by apply middleware to the app.
 */
export default function apolloServer(app) {
  const schema = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req, connection }) => {
      if (connection) {
        // For subscriptions
        return {
          models,
        };
      }

      const currentUser = req.session.user;

      return {
        currentUser,
        models,
      };
    },
  });
  schema.applyMiddleware({ app });
}
