import { ApolloProvider, getDataFromTree } from 'react-apollo';
import createApolloClient from '../data/apollo_client';
import { NotFoundError } from './exceptions';
import { renderToString } from 'react-dom/server';
import React from 'react';

export default async (req, res, next, type, preamble, el) => {
  const apolloClient = await createApolloClient(req);

  const tree = <ApolloProvider client={apolloClient}>{el}</ApolloProvider>;

  try {
    await getDataFromTree(tree);
  } catch (ex) {
    if (ex instanceof NotFoundError) {
      res.sendStatus(404);
    } else {
      next(ex);
    }
    return;
  }

  try {
    let renderedTree = renderToString(tree);

    // XXX(mime): in the feeds I have some attributes that are `ref`. However, ref isn't allowed in React,
    // so in the DOM they are `refXXX`. Return them to normal here, sigh.
    renderedTree = renderedTree.replace(/refXXX="([^"]+)"/g, 'ref="$1"');

    res.type(type);
    res.write(preamble);
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
