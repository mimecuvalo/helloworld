import fetch from 'node-fetch';
import { HTTPError } from 'server/util/exceptions';
import sanitizer from 'sanitize-html';

export async function fetchUrl(url, opt_headers) {
  try {
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
  } catch (ex) {
    throw ex;
  }
}

export async function fetchText(url, opt_headers) {
  const response = await fetchUrl(url);
  return await response.text();
}

export async function fetchJSON(url, opt_headers) {
  const response = await fetchUrl(url, opt_headers);
  return await response.json();
}

export function createAbsoluteUrl(websiteUrl, url) {
  if (url?.startsWith('/')) {
    const parsedUrl = new URL(websiteUrl);
    url = `${parsedUrl.origin}${url}`;
  }

  return url;
}

export function isRobotViewing(req) {
  const userAgent = req.headers['x-user-agent'] || req.headers['user-agent'];
  return !!userAgent?.match(/bot|spider|crawl|slurp|ia_archiver/i);
}

export function sanitizeHTML(rawHTML) {
  return sanitizer(rawHTML, {
    allowedTags: sanitizer.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'title'],
      img: ['src', 'srcset', 'width', 'height', 'alt', 'title'],
      iframe: ['src', 'width', 'height', 'alt', 'title'],
    },
  });
}
