export function contentUrl(content, host = false, searchParams) {
  if (!content.name) {
    return null;
  }

  let url = '';

  /*
  TODO(mime):
  if (host) {
    url += handler.request.protocol + "://" + handler.request.host
  }*/

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
  } else if (content.name === 'home' /* TODO(mime): && handler.hostname_user*/) {
    url += '/';
  }

  if (searchParams) {
    url += '?' + new URLSearchParams(searchParams).toString();
  }

  return prettifyUrl(url);
}

export function navUrl(username = '') {
  return `/${username}`;
}

function prettifyUrl(url) {
  return url.replace(/ /g, '+');
}
