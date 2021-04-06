import { buildUrl } from 'shared/util/url_factory';
import express from 'express';

// OpenSearch is a way to tell your browser to let a user hit <tab> and search your site.
// See http://www.opensearch.org/Home
export default function openSearchRouterFactory({ appName }) {
  const router = express.Router();

  router.use((req, res) => {
    const username = req.query.username;
    const searchUrl = buildUrl({ req, pathname: `/${username}/search/{searchTerms}` });
    const faviconUrl = buildUrl({ req, pathname: '/favicon.ico' });

    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
        <ShortName>${appName}</ShortName>
        <Description>Search ${appName}</Description>
        <Url type="text/html" method="get" template="${searchUrl}"/>
        <Image height="16" width="16" type="image/x-icon">${faviconUrl}</Image>
      </OpenSearchDescription>`);
  });

  return router;
}
