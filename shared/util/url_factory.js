export function contentUrl(content, reqOrIsAbsolute = false, searchParams) {
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

  const req = typeof reqOrIsAbsolute === 'object' && reqOrIsAbsolute;
  const isAbsolute = typeof reqOrIsAbsolute === 'boolean' && reqOrIsAbsolute;

  return buildUrl({ req, isAbsolute, pathname, searchParams });
}

export function parseContentUrl(url) {
  const splitUrl = url.split('/');
  const username = splitUrl[1];
  const name = splitUrl.length > 2 ? splitUrl.slice(-1)[0] : 'home';

  return { username, name };
}

export function profileUrl(username, reqOrIsAbsolute = false) {
  const req = typeof reqOrIsAbsolute === 'object' && reqOrIsAbsolute;
  const isAbsolute = typeof reqOrIsAbsolute === 'boolean' && reqOrIsAbsolute;

  return buildUrl({ req, isAbsolute, pathname: `/${username}` });
}

export function buildUrl({ req, isAbsolute, pathname, searchParams }) {
  let url = '';

  if (req) {
    const protocol = req.get('x-scheme') || req.protocol;
    url += `${protocol}://${req.get('host')}`;
  } else if (isAbsolute) {
    url += `${window.location.origin}`;
  }

  url += pathname;

  if (searchParams) {
    url += '?' + new URLSearchParams(searchParams).toString();
  }

  return prettifyUrl(url);
}

function prettifyUrl(url) {
  return url.replace(/ /g, '+');
}
