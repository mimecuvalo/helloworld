import { buildUrl } from '../../../shared/util/url_factory';
import configuration from '../../app/configuration';
import { createNewBlock } from '../utils/Blocks';
import { getTextForLine, insertTextAtLine } from '../utils/Text';
import mime from 'mime/lite';

export default async function unfurl(url, editorState) {
  if (mime.getType(url)?.match(/^image\//)) {
    const src = url;
    const href = url;
    const alt = '';
    editorState = createNewBlock('IMAGE', 'img', editorState, { src, alt }, { href, src, alt });

    return { editorState, isError: false, wasMediaFound: true, isImg: true, thumb: url };
  }

  let response;
  try {
    response = await fetch(buildUrl({ pathname: '/api/unfurl' }), {
      method: 'POST',
      body: JSON.stringify({
        url,
        _csrf: configuration.csrf,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
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
      const href = json.image;
      const src = json.image;
      const alt = json.title;
      isImg = true;
      editorState = createNewBlock('IMAGE', 'img', editorState, { src, alt }, { href, src, alt });
      thumb = json.image;
    }

    const titleLine = getTextForLine(editorState, 0);
    if (!titleLine) {
      editorState = insertTextAtLine(editorState, 0, json.title);
    }
  }

  return { editorState, isError: false, wasMediaFound: json.wasMediaFound, isImg, thumb };
}
