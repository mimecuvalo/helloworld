import { buildUrl } from '../../../shared/util/url_factory';
import configuration from '../../app/configuration';
import { createNewBlock } from '../utils/Blocks';
import { EditorState, Modifier, SelectionState } from 'draft-js';
import { getTextForLine } from '../utils/Text';

export default async function unfurl(url, editorState) {
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
  if (json.success) {
    if (json.iframe) {
      editorState = createNewBlock('IFRAME', 'iframe', editorState, json.iframe, json.iframe);
    } else {
      const href = json.image;
      const src = json.image;
      const alt = json.title;
      editorState = createNewBlock('IMAGE', 'img', editorState, { src, alt }, { href, src, alt });
    }

    const titleLine = getTextForLine(editorState, 0);
    if (!titleLine) {
      const selectionState = SelectionState.createEmpty(
        editorState
          .getCurrentContent()
          .getBlockMap()
          .first()
          .getKey()
      ).merge({
        anchorOffset: 0,
        focusOffset: 0,
      });
      const newContentState = Modifier.replaceText(editorState.getCurrentContent(), selectionState, json.title);
      editorState = EditorState.push(editorState, newContentState, 'set-title');
    }
  }

  return { editorState, isError: false };
}
