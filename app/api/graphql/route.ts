import { NextRequest, NextResponse } from 'next/server';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { createContext } from 'data/context';
import pick from 'lodash/pick';
import resolvers from 'data/resolvers';
import typeDefs from 'data/schema';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV === 'development',
  plugins: [],
  formatError: (err) => {
    return pick(err, 'message');
  },
  allowBatchedHttpRequests: true,
});

export default startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => {
    return createContext(req);
  },
});

export async function OPTIONS() {
  if (process.env.NODE_ENV === 'development') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://studio.apollographql.com',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  return new NextResponse(null, { status: 405 });
}
