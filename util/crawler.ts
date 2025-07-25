import { HTTPError } from 'util/exceptions';
import { NextApiRequest } from 'next';
import sanitizer from 'sanitize-html';

export async function fetchUrl(url: string, opt_headers?: { [key: string]: string }) {
  const headers = Object.assign(
    {
      'user-agent': 'hello, world bot.',
    },
    opt_headers || {}
  );
  const response = await fetch(url, { headers });
  if (response.status >= 400) {
    throw new HTTPError(response.status, url);
  }
  return response;
}

export async function fetchText(url: string) {
  const response = await fetchUrl(url);
  return await response.text();
}

export async function fetchJSON(url: string, opt_headers?: { [key: string]: string }) {
  const response = await fetchUrl(url, opt_headers);
  return await response.json();
}

export function createAbsoluteUrl(websiteUrl: string, url: string): string {
  if (url?.startsWith('/')) {
    const parsedUrl = new URL(websiteUrl);
    url = `${parsedUrl.origin}${url}`;
  }

  return url;
}

export function isRobotViewing(req: NextApiRequest) {
  const userAgent = (req.headers['x-user-agent'] || req.headers['user-agent']) as string;
  return !!userAgent?.match(/bot|spider|crawl|slurp|ia_archiver/i);
}

export function sanitizeHTML(rawHTML: string) {
  return sanitizer(rawHTML, {
    allowedTags: sanitizer.defaults.allowedTags.concat(['img', 'audio', 'video', 'picture', 'svg', 'iframe', 'embed']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'title'],
      // N.B. For now we don't allow srcset because sometimes we have relative urls in there
      // and I don't feel like parsing it right now to add the correct base origin, e.g. kottke.org.
      img: ['src', 'width', 'height', 'alt', 'title'],
      iframe: ['src', 'width', 'height', 'alt', 'title'],
    },
  });
}
