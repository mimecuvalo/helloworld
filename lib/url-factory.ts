export type ContentUrlParts = {
  username: string;
  name: string;
  section: string;
  album: string;
  template?: string | null;
};

export function thumbUrl(thumb?: string | null): string {
  if (!thumb) return '/img/pixel.gif';
  if (!thumb.startsWith('/resource')) return thumb;
  const bucket = (import.meta.env?.VITE_S3_BUCKET_NAME as string | undefined) || '';
  return bucket ? `https://${bucket}${thumb.replace('/resource', '')}` : thumb;
}

export function contentUrl(
  content: Pick<ContentUrlParts, 'username' | 'name' | 'section' | 'album'>,
  searchParams?: { [key: string]: string },
  host?: string
) {
  if (!content?.name) return '';

  let pathname = '';
  if (content.name !== 'main') pathname += '/' + content.username;
  if (content.section !== 'main') pathname += '/' + content.section;
  if (content.album && content.album !== 'main') pathname += '/' + content.album;
  if (content.name !== 'home' && content.name !== 'main') {
    pathname += '/' + content.name;
  } else if (content.name === 'home') {
    pathname += '/';
  }

  return buildUrl({ host, pathname, searchParams });
}

export function parseContentUrl(url: string): { username: string; name: string } {
  url = url.replace(/^acct:/, '');
  if (url.indexOf('@') !== -1) {
    url = '/' + url.split('@')[0];
  }

  // A bare username (no scheme, no slash) is a valid thing to be handed here —
  // new URL() would throw on it, taking down whatever called us.
  if (!url.startsWith('/') && !/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return { username: url, name: 'home' };
  }
  url = url.startsWith('/') ? url : new URL(url).pathname;
  const splitUrl = url.split('/');
  const username = splitUrl[1];
  const name = splitUrl.length > 2 ? splitUrl.slice(-1)[0] : 'home';

  return { username, name };
}

export function profileUrl(username: string, host?: string): string {
  return buildUrl({ host, pathname: `/${username}` });
}

export function buildUrl({
  host,
  isAbsolute,
  pathname,
  searchParams,
}: {
  host?: string;
  isAbsolute?: boolean;
  pathname: string;
  searchParams?: { [key: string]: string };
}): string {
  let url = '';

  if (isAbsolute && typeof window !== 'undefined') {
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
