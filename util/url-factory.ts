import { Content } from 'data/graphql-generated';
import { NextApiRequest } from 'next';
import { NextRequest } from 'next/server';

type RequestType = NextApiRequest | NextRequest | false;

export function contentUrl(
  content: Pick<Content, 'username' | 'name' | 'section' | 'album'>,
  req?: RequestType,
  searchParams?: { [key: string]: string },
  host?: string
) {
  if (!content?.name) {
    return '';
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

  return buildUrl({ req, host, pathname, searchParams });
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

export function profileUrl(username: string, req?: RequestType, host?: string): string {
  return buildUrl({ req, host, pathname: `/${username}` });
}

function getHostFromRequest(req: RequestType): string | undefined {
  if (!req) return undefined;

  // NextRequest from App Router
  if ('nextUrl' in req) {
    return req.headers.get('host') || req.nextUrl.host;
  }

  // NextApiRequest from Pages Router
  if ('headers' in req) {
    return req.headers['host'] as string;
  }

  return undefined;
}

export function buildUrl({
  req,
  host,
  isAbsolute,
  pathname,
  searchParams,
}: {
  req?: RequestType;
  host?: string;
  isAbsolute?: boolean;
  pathname: string;
  searchParams?: { [key: string]: string };
}): string {
  let url = '';

  if (req) {
    const requestHost = getHostFromRequest(req);
    if (requestHost) {
      url += `https://${requestHost}`;
    }
  } else if (isAbsolute) {
    url += window.location.origin;
  } else if (host) {
    url += host.startsWith('localhost:') ? `http://${host}` : `https://${host}`;
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

export function ensureAbsoluteUrl(basisAbsoluteUrl: string, urlOrPath: string) {
  const parsedUrl = new URL(basisAbsoluteUrl);
  const hostnameAndProtocol = `${parsedUrl.protocol}//${parsedUrl.host}`;

  urlOrPath = urlOrPath || '';
  return urlOrPath[0] === '/' ? `${hostnameAndProtocol}${urlOrPath}` : urlOrPath;
}

export function constructNextImageURL(src: string, size = 3840) {
  if (
    !process.env.IS_STORYBOOK &&
    (src.startsWith(`https://${process.env.NEXT_PUBLIC_S3_AWS_S3_BUCKET_NAME}`) ||
      src.startsWith(`https://s3.amazonaws.com`))
  ) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${size}&q=75`;
  }

  return src;
}
