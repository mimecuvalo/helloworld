export function buildUrl({ req, isAbsolute, pathname, searchParams }) {
  let url = '';

  if (req) {
    const protocol = req.get('x-scheme') || req.protocol;
    url += `${protocol}://${req.get('host')}`;
  } else if (isAbsolute) {
    url += `${window.location.origin}`;
  }

  url += !pathname || pathname.startsWith('/') ? pathname : new URL(pathname).pathname;

  if (searchParams) {
    url += '?' + new URLSearchParams(searchParams).toString();
  }

  return prettifyUrl(url);
}

export function prettifyUrl(url) {
  return url.replace(/ /g, '+');
}
