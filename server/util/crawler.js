import fetch from 'node-fetch';
import { NotFoundError } from '../util/exceptions';

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

export function createAbsoluteUrl(websiteUrl, url) {
  if (url.startsWith('/')) {
    const parsedUrl = new URL(websiteUrl);
    url = `${parsedUrl.origin}${url}`;
  }

  return url;
}