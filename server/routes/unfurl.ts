import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import type { AppEnv } from '../env';
import { assertAuthenticated } from '../authorization';

const IFRAME_ALLOW = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';

function parseIframe(html: string): Record<string, string | number> | undefined {
  const $ = cheerio.load(html);
  const iframe = $('iframe').first();
  if (!iframe.length) return undefined;

  const src = iframe.attr('src');
  if (!src) return undefined;

  const width = Number(iframe.attr('width'));
  const height = Number(iframe.attr('height'));
  return {
    src,
    width: width >= 400 ? width : 480,
    height: height >= 300 ? height : 270,
    frameBorder: 0,
    allow: iframe.attr('allow') || IFRAME_ALLOW,
  };
}

async function retrieveOEmbed(oEmbedUrl: string) {
  const response = await fetch(oEmbedUrl, { headers: { 'User-Agent': 'hello-world-unfurl/1.0' } });
  if (!response.ok) throw new Error(`oEmbed request failed: ${response.status}`);

  const json = (await response.json()) as {
    html?: string;
    title?: string;
    thumbnail_url?: string;
  };
  return {
    title: json.title || '',
    image: json.thumbnail_url || '',
    iframe: json.html ? parseIframe(json.html) : undefined,
  };
}

export const unfurlRoutes = new Hono<AppEnv>().post(
  '/unfurl',
  zValidator('json', z.object({ url: z.string().url() })),
  async (c) => {
    assertAuthenticated(c.get('ctx'));
    const { url } = c.req.valid('json');

    try {
      const parsedUrl = new URL(url);
      if (/(^|\.)youtube\.com$/.test(parsedUrl.hostname) || /(^|\.)youtu\.be$/.test(parsedUrl.hostname)) {
        const embed = await retrieveOEmbed(
          `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(parsedUrl.toString())}`
        );
        return c.json({ wasMediaFound: !!(embed.image || embed.iframe), ...embed });
      }

      const res = await fetch(url, { headers: { 'User-Agent': 'hello-world-unfurl/1.0' } });
      if (!res.ok) throw new Error(`Unfurl request failed: ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);

      const oEmbedHref = $('link[rel="alternate"][type="application/json+oembed"]').first().attr('href');
      if (oEmbedHref) {
        const embed = await retrieveOEmbed(new URL(oEmbedHref, parsedUrl).toString());
        return c.json({ wasMediaFound: !!(embed.image || embed.iframe), ...embed });
      }

      const meta = (name: string) =>
        $(`meta[property="${name}"]`).attr('content') || $(`meta[name="${name}"]`).attr('content') || '';

      const title = meta('og:title') || $('title').first().text() || '';
      const image = meta('og:image:secure_url') || meta('og:image') || meta('twitter:image') || '';
      const videoUrl = meta('og:video:secure_url') || meta('og:video:url') || meta('og:video') || '';

      if (videoUrl) {
        return c.json({
          wasMediaFound: true,
          iframe: {
            src: videoUrl,
            width: Number(meta('og:video:width')) || 480,
            height: Number(meta('og:video:height')) || 270,
            frameBorder: 0,
            allow: IFRAME_ALLOW,
          },
          image,
          title,
        });
      }

      return c.json({ wasMediaFound: !!image, image, title });
    } catch {
      return c.json({ wasMediaFound: false, image: '', title: '' });
    }
  }
);
