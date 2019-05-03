import fetch from 'node-fetch';
import { NotFoundError } from '../util/exceptions';
import sanitizer from 'sanitize-html';

export async function fetchUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'hello, world bot.',
      },
    });
    if (response.status !== 200) {
      throw new NotFoundError();
    }
    return response;
  } catch (ex) {
    throw ex;
  }
}

export async function fetchText(url) {
  const response = await fetchUrl(url);
  return await response.text();
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
