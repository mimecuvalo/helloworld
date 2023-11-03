import { NextApiRequest, NextApiResponse } from 'next';
import { createAbsoluteUrl, fetchUrl } from 'util/crawler';

import _ from 'lodash';
import authenticate from 'app/authentication';
import cheerio from 'cheerio';

const IFRAME_ALLOW = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const embed = await discoverAndRetrieveOEmbedOrOpenGraphDataFromUrl(req.body.url);
  if (!embed) {
    res.json({ success: false });
    return;
  }

  res.json({ success: true, wasMediaFound: !!(embed.image || embed.iframe), ...embed });
});

async function discoverAndRetrieveOEmbedOrOpenGraphDataFromUrl(url: string) {
  const response = await fetchUrl(url);
  const content = await response.text();

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/html')) {
    return await parseHtmlAndRetrieveOEmbedOrOpenGraphData(url, content);
  }

  return null;
}

async function parseHtmlAndRetrieveOEmbedOrOpenGraphData(websiteUrl: string, html: string) {
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
async function retrieveOEmbedData(oEmbedUrl: string) {
  const response = await fetchUrl(oEmbedUrl);
  // TODO: type as html/oembed object later?
  const json = (await response.json()) as unknown as any;

  const html = json.html;

  let iframe: { [key: string]: string | number } = {};
  if (unescape(html).indexOf('<iframe ') !== -1) {
    const regexString = `([a-zA-Z]+)=['"]([^'"]+)['"]`;
    iframe = _.fromPairs(
      html.match(new RegExp(regexString, 'g')).map((p: string) => {
        const pair = p.match(new RegExp(regexString));
        return [pair?.[1], pair?.[2]];
      })
    );
    iframe['src'] = iframe['src'] || '';
    iframe['width'] = iframe['width'] && (iframe['width'] as number) >= 400 ? iframe['width'] : 480;
    iframe['height'] = iframe['height'] && (iframe['height'] as number) >= 300 ? iframe['height'] : 270;
    iframe['frameBorder'] = 0;
    iframe['allow'] = iframe['allow'] || IFRAME_ALLOW;
  }

  return { type: 'oEmbed', title: json.title, image: json.thumbnail_url, iframe };
}

function retrieveOpenGraphData($: cheerio.Root) {
  const openGraphProperties = $('meta[property]').filter(
    (index, el) => ($(el).attr('property') || '').indexOf('og:') === 0
  );
  const openGraphObj: { [key: string]: string | undefined } = {};
  openGraphProperties.each(function (i, el) {
    openGraphObj[$(el).attr('property')?.slice(3) || ''] = $(el).attr('content');
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
