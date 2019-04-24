import { ApolloProvider, getDataFromTree } from 'react-apollo';
import createApolloClient from '../data/apollo_client';
import { NotFoundError } from './exceptions';
import { renderToString } from 'react-dom/server';
import React from 'react';

export default async (req, res, next, el) => {
  const apolloClient = await createApolloClient(req);

  const tree = <ApolloProvider client={apolloClient}>{el}</ApolloProvider>;

  try {
    await getDataFromTree(tree);
  } catch (ex) {
    next(ex);
    return;
  }

  try {
    const renderedTree = renderToString(tree);
    res.write(renderedTree);
    res.end();
  } catch (ex) {
    if (ex instanceof NotFoundError) {
      res.sendStatus(404);
    } else {
      next(ex);
    }
    return;
  }
};
