import type { NextApiRequest, NextApiResponse } from 'next';

import { ApolloServer } from 'apollo-server-micro';
import { createContext as context } from 'data/context';
import pick from 'lodash/pick';
import resolvers from 'data/resolvers';
import typeDefs from 'data/schema';

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context,
  cache: 'bounded', // Prevent DOS. See: https://www.apollographql.com/docs/apollo-server/performance/cache-backends/
  formatError: (err) => {
    return pick(err, 'message');
  },
});

const startServer = apolloServer.start();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', 'https://studio.apollographql.com');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  } else {
    if (req.method !== 'POST') {
      res.end();
      return false;
    }
  }

  if (req.method === 'OPTIONS') {
    res.end();
    return false;
  }

  await startServer;
  await apolloServer.createHandler({
    path: '/api/graphql',
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
