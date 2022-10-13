import { NextApiRequest } from 'next';

export function contentUrl(content: Content, req?: NextApiRequest, searchParams?: URLSearchParams) {
  if (!content?.name) {
    return null;
  }

  let pathname = '';

  if (content.name !== 'main') {
    pathname += '/' + content.username;
  }

  if (content.section !== 'main') {
    pathname += '/' + content.section;
  }

  if (content.album && content.album !== 'main') {
    pathname += '/' + content.album;
  }

  if (content.name !== 'home' && content.name !== 'main') {
    pathname += '/' + content.name;
  } else if (content.name === 'home') {
    pathname += '/';
  }

  return buildUrl({ req, pathname, searchParams });
}

export function parseContentUrl(url: string): { username: string; name: string } {
  // Some urls are of the form 'acct:username@domain.com'
  url = url.replace(/^acct:/, '');
  if (url.indexOf('@') !== -1) {
    url = '/' + url.split('@')[0];
  }

  url = url.startsWith('/') ? url : new URL(url).pathname;
  const splitUrl = url.split('/');
  const username = splitUrl[1];
  const name = splitUrl.length > 2 ? splitUrl.slice(-1)[0] : 'home';

  return { username, name };
}

export function profileUrl(username: string, req: NextApiRequest): string {
  return buildUrl({ req, pathname: `/${username}` });
}

export function buildUrl({
  req,
  isAbsolute,
  pathname,
  searchParams,
}: {
  req: NextApiRequest;
  isAbsolute?: boolean;
  pathname: string;
  searchParams?: URLSearchParams;
}): string {
  let url = '';

  if (req) {
    url += `${new URL(req.url || '').protocol}://${req.headers['host']}`;
  } else if (isAbsolute) {
    url += `${window.location.origin}`;
  }

  url += !pathname || pathname.startsWith('/') ? pathname : new URL(pathname).pathname;

  if (searchParams) {
    url += '?' + new URLSearchParams(searchParams).toString();
  }

  return prettifyUrl(url);
}

export function prettifyUrl(url: string) {
  return url.replace(/ /g, '+');
}

export function ensureAbsoluteUrl(basisAbsoluteUrl, urlOrPath) {
  const parsedUrl = new URL(basisAbsoluteUrl);
  const hostnameAndProtocol = `${parsedUrl.protocol}//${parsedUrl.host}`;

  urlOrPath = urlOrPath || '';
  return urlOrPath[0] === '/' ? `${hostnameAndProtocol}${urlOrPath}` : urlOrPath;
}
