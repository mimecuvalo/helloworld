import { ApolloServer } from 'apollo-server-express';
import createLoaders from './graphql/loaders';
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
      const hostname = req.header('x-forwarded-host') || req.hostname;

      return {
        currentUser,
        hostname,
        loaders: createLoaders(),
        models,
        req,
      };
    },
  });
  schema.applyMiddleware({ app });
}
