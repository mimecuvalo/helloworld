export function contentUrl(content, host=false, searchParams={}) {
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

/* TODO(mime): use new URL()
  if searchParams:
    for arg in searchParams:
      searchParams[arg] = searchParams[arg].encode('utf-8')
    url += '?' + urllib.urlencode(searchParams)
    */

  return prettifyUrl(url);
}

export function navUrl(username = '') {
  return `/${username}`;
}

function prettifyUrl(url) {
  return url.replace(/ /g, '+');
}