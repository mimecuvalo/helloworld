import _ from 'lodash';
import cheerio from 'cheerio';
import express from 'express';
import { fetchUrl, createAbsoluteUrl } from '../util/crawler';

const IFRAME_ALLOW = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';

const router = express.Router();
router.post('/', async (req, res) => {
  const embed = await discoverAndRetrieveOEmbedOrOpenGraphDataFromUrl(req.body.url);
  if (!embed) {
    res.json({ success: false });
    return;
  }

  res.json({ success: true, wasMediaFound: !!(embed.image || embed.iframe), ...embed });
});

async function discoverAndRetrieveOEmbedOrOpenGraphDataFromUrl(url) {
  const response = await fetchUrl(url);
  const content = await response.text();

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/html')) {
    return await parseHtmlAndRetrieveOEmbedOrOpenGraphData(url, content);
  }

  return null;
}

async function parseHtmlAndRetrieveOEmbedOrOpenGraphData(websiteUrl, html) {
  const parsedUrl = new URL(websiteUrl);
  const $ = cheerio.load(html);
  const oEmbedLinks = $('link[rel="alternate"]').filter(
    (index, el) => ($(el).attr('type') || '') === 'application/json+oembed'
  );
  let oEmbedUrl = oEmbedLinks.first().attr('href');

  // XXX: YouTube doesn't like scraping so much, starts throwing up captchas. Just go directly to the oEmbed endpoint.
  if (parsedUrl.hostname.match(/youtube.com$/)) {
    const videoId = parsedUrl.searchParams.get('v');
    oEmbedUrl = `https://www.youtube.com/oembed?url=http%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D${videoId}`;
  }

  if (oEmbedUrl) {
    oEmbedUrl = createAbsoluteUrl(websiteUrl, oEmbedUrl);
    return await retrieveOEmbedData(oEmbedUrl);
  }

  return retrieveOpenGraphData($);
}

// We don't bother with XML support for oEmbed. Basically everyone supports JSON at this point.
async function retrieveOEmbedData(oEmbedUrl) {
  const response = await fetchUrl(oEmbedUrl);
  const json = await response.json();

  const html = json.html;

  let iframe = {};
  if (unescape(html).indexOf('<iframe ') !== -1) {
    const regexString = `([a-zA-Z]+)=['"]([^'"]+)['"]`;
    iframe = _.fromPairs(
      html.match(new RegExp(regexString, 'g')).map(p => {
        const pair = p.match(new RegExp(regexString));
        return [pair[1], pair[2]];
      })
    );
    iframe['src'] = iframe['src'] || '';
    iframe['width'] = iframe['width'] && iframe['width'] >= 400 ? iframe['width'] : 480;
    iframe['height'] = iframe['height'] && iframe['height'] >= 300 ? iframe['height'] : 270;
    iframe['frameBorder'] = 0;
    iframe['allow'] = iframe['allow'] || IFRAME_ALLOW;
  }

  return { type: 'oEmbed', title: json.title, image: json.thumbnail_url, iframe };
}

function retrieveOpenGraphData($) {
  const openGraphProperties = $('meta[property]').filter(
    (index, el) => ($(el).attr('property') || '').indexOf('og:') === 0
  );
  const openGraphObj = {};
  openGraphProperties.each(function(i, el) {
    openGraphObj[
      $(el)
        .attr('property')
        .slice(3)
    ] = $(el).attr('content');
  });

  return {
    type: 'Open Graph',
    title: openGraphObj['title'],
    image: openGraphObj['image:secure_url'] || openGraphObj['image'],
    iframe: openGraphObj['type'] === 'video' && {
      src: openGraphObj['video:secure_url'] || openGraphObj['video:url'],
      width: openGraphObj['video:width'],
      height: openGraphObj['video:height'],
      frameBorder: 0,
      allow: IFRAME_ALLOW,
    },
  };
}

export default router;
