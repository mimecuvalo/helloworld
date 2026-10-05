import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import type { AppEnv } from '../env';
import { assertAuthenticated } from '../authorization';
import { assertPublicUrl } from '../util/safe-fetch';

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
    frameborder: 0,
    allow: iframe.attr('allow') || IFRAME_ALLOW,
    title: iframe.attr('title') || '',
  };
}

// youtu.be/<id>, /watch?v=<id>, /embed/<id>, /shorts/<id>, /live/<id>.
function youTubeVideoId(parsedUrl: URL) {
  if (/(^|\.)youtu\.be$/.test(parsedUrl.hostname)) return parsedUrl.pathname.split('/')[1] || '';
  if (!/(^|\.)youtube\.com$/.test(parsedUrl.hostname)) return '';

  const [, kind, id] = parsedUrl.pathname.split('/');
  return parsedUrl.searchParams.get('v') || (['embed', 'shorts', 'live', 'v'].includes(kind) ? id || '' : '');
}

async function retrieveOEmbed(oEmbedUrl: string) {
  await assertPublicUrl(oEmbedUrl);
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
      const videoId = youTubeVideoId(parsedUrl);

      // A pasted url is only ever meant to point at something public, so refuse one
      // that resolves to a loopback, private, or link-local address (which covers the
      // cloud metadata endpoint at 169.254.169.254) before the server fetches it.
      await assertPublicUrl(url);

      const res = await fetch(url, { headers: { 'User-Agent': 'hello-world-unfurl/1.0' } });
      if (!res.ok) throw new Error(`Unfurl request failed: ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);

      const meta = (name: string) =>
        $(`meta[property="${name}"]`).attr('content') || $(`meta[name="${name}"]`).attr('content') || '';

      const pageTitle = $('title').first().text().trim();
      // Youtube suffixes its <title> with ' - YouTube', and its js-only shells
      // (shorts) leave nothing but that suffix.
      const title =
        meta('og:title') ||
        meta('twitter:title') ||
        (videoId ? pageTitle.replace(/(^-?\s*|\s+-\s+)YouTube$/, '') : pageTitle);
      const image =
        meta('og:image:secure_url') ||
        meta('og:image') ||
        meta('twitter:image') ||
        (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');
      // A youtube player url is derivable from the video id, so a video whose
      // oEmbed call 404s or gets rate-limited still embeds off the page's tags.
      const videoUrl =
        meta('og:video:secure_url') ||
        meta('og:video:url') ||
        meta('og:video') ||
        (videoId ? `https://www.youtube.com/embed/${videoId}` : '');

      const oEmbedHref = $('link[rel="alternate"][type="application/json+oembed"]').first().attr('href');
      if (oEmbedHref) {
        // Best-effort: we already hold the page, so a dead or bot-blocked oEmbed
        // endpoint means falling through to its og: tags, and one that answers
        // with gaps (no title, say) gets them filled from the same tags.
        const embed = await retrieveOEmbed(new URL(oEmbedHref, parsedUrl).toString()).catch((err) => {
          console.error(`oEmbed failed for ${oEmbedHref}:`, err);
          return undefined;
        });
        if (embed && (embed.image || embed.iframe)) {
          return c.json({
            wasMediaFound: true,
            iframe: embed.iframe && { ...embed.iframe, title: embed.iframe.title || embed.title || title },
            image: embed.image || image,
            title: embed.title || title,
          });
        }
      }

      if (videoUrl) {
        return c.json({
          wasMediaFound: true,
          iframe: {
            src: videoUrl,
            width: Number(meta('og:video:width')) || 480,
            height: Number(meta('og:video:height')) || 270,
            frameborder: 0,
            allow: IFRAME_ALLOW,
            title,
          },
          image,
          title,
        });
      }

      return c.json({ wasMediaFound: !!image, image, title });
    } catch (err) {
      console.error(`unfurl failed for ${url}:`, err);
      return c.json({ wasMediaFound: false, image: '', title: '' });
    }
  }
);
