export function contentUrl(content, req = null, searchParams) {
  if (!content.name) {
    return null;
  }

  let url = '';

  if (content.name !== 'main') {
    url += '/' + content.username;
  }

  if (content.section !== 'main') {
    url += '/' + content.section;
  }

  if (content.album && content.album !== 'main') {
    url += '/' + content.album;
  }

  if (content.name !== 'home' && content.name !== 'main') {
    url += '/' + content.name;
  } else if (content.name === 'home') {
    url += '/';
  }

  if (searchParams) {
    url += '?' + new URLSearchParams(searchParams).toString();
  }

  if (req) {
    url = absoluteUrl(req, url);
  }

  return prettifyUrl(url);
}

export function navUrl(username = '', protocolAndHost = '') {
  let url = '';

  if (protocolAndHost) {
    url += protocolAndHost;
  }

  url += `/${username}`;

  return url;
}

export function absoluteUrl(req, url) {
  return `${req.protocol}://${req.get('host')}${url}`;
}

export function absoluteClientsideUrl(url) {
  return `${window.location.protocol}//${window.location.host}${url}`;
}

function prettifyUrl(url) {
  return url.replace(/ /g, '+');
}
