import { getTextForLine, insertTextAtLine } from '../utils/Text';

import { buildUrl } from '../utils/url_factory';
import { createNewBlock } from '../utils/Blocks';
import mime from 'mime/lite';

const IFRAME_ALLOW = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';

export default async function unfurl(onLinkUnfurl, url, editorState) {
  if (url.match(/^<iframe /)) {
    const iframe = {
      src: url.match(/src=['"]([^'"]+)['"]/)[1],
      width: url.match(/width=['"]([^'"]+)['"]/)[1] || 400,
      height: url.match(/height=['"]([^'"]+)['"]/)[1] || 300,
      frameBorder: 0,
      allow: url.match(/allow=['"]([^'"]+)['"]/)[1] || IFRAME_ALLOW,
    };
    editorState = createNewBlock('IFRAME', 'iframe', editorState, iframe, iframe);

    return { editorState, isError: false, wasMediaFound: true, isImg: false };
  }

  if (mime.getType(url)?.match(/^image\//)) {
    const src = url;
    const href = url;
    const alt = '';
    editorState = createNewBlock('IMAGE', 'img', editorState, { href, src, alt }, { href, src, alt });

    return { editorState, isError: false, wasMediaFound: true, isImg: true, thumb: url };
  }

  let response;
  try {
    response = await onLinkUnfurl(url);
  } catch (ex) {
    return { isError: true };
  }

  const json = await response.json();
  let thumb;
  let isImg = false;
  if (json.wasMediaFound) {
    if (json.iframe) {
      editorState = createNewBlock('IFRAME', 'iframe', editorState, json.iframe, json.iframe);
      thumb = json.image;
    } else {
      const href = url;
      const src = json.image;
      const alt = json.title;
      isImg = true;
      editorState = createNewBlock('IMAGE', 'img', editorState, { href, src, alt }, { href, src, alt });
      thumb = json.image;
    }

    const titleLine = getTextForLine(editorState, 0);
    if (!titleLine) {
      editorState = insertTextAtLine(editorState, 0, json.title);
    }
  }

  return { editorState, isError: false, wasMediaFound: json.wasMediaFound, isImg, thumb };
}
