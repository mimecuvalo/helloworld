export function contentUrl(content, protocolAndHost = '', searchParams) {
  if (!content.name) {
    return null;
  }

  let url = '';

  if (protocolAndHost) {
    url += protocolAndHost;
  }

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

function prettifyUrl(url) {
  return url.replace(/ /g, '+');
}
