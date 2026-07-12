import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import type { AppEnv } from '../env';
import { assertAuthenticated } from '../authorization';

export const unfurlRoutes = new Hono<AppEnv>().post(
  '/unfurl',
  zValidator('json', z.object({ url: z.string().url() })),
  async (c) => {
    assertAuthenticated(c.get('ctx'));
    const { url } = c.req.valid('json');

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'hello-world-unfurl/1.0' } });
      const html = await res.text();
      const $ = cheerio.load(html);

      const meta = (name: string) =>
        $(`meta[property="${name}"]`).attr('content') || $(`meta[name="${name}"]`).attr('content') || '';

      const title = meta('og:title') || $('title').first().text() || '';
      const image = meta('og:image') || meta('twitter:image') || '';
      const videoUrl = meta('og:video:url') || meta('og:video') || '';

      if (videoUrl) {
        return c.json({
          wasMediaFound: true,
          iframe: { src: videoUrl, width: 400, height: 300, frameBorder: 0 },
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
