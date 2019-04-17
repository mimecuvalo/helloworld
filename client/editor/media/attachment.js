import { buildUrl } from '../../../shared/util/url_factory';
import configuration from '../../app/configuration';
import insertAtomicBlockShim from '../utils/AtomicBlockUtilsShim';

// TODO(mime): move this somewhere else.
export default async function uploadFiles(editorState, files) {
  const body = new FormData();
  for (const file of files) {
    body.append('files', file, file.name);
  }

  const response = await fetch(buildUrl({ pathname: '/api/upload' }), {
    method: 'POST',
    body,
    headers: { 'x-csrf-token': configuration.csrf },
  });

  editorState = await handleUploadComplete(editorState, response);

  return editorState;
}

async function handleUploadComplete(editorState, response) {
  const files = await response.json();

  for (const fileInfo of files) {
    if (fileInfo.isError) {
      return { editorState, isError: true };
    }

    const href = fileInfo.original;
    const src = fileInfo.normal;
    //const thumb = fileInfo.thumb;
    const alt = '';

    // TODO(mime): ostensibly, you shouldn't need this since we have the data at the block level.
    // DraftEntity's are apparently going away 'soon'.
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', { src, alt });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    editorState = insertAtomicBlockShim(editorState, entityKey, ' ', { nodeName: 'img', href, src, alt });
  }

  return { editorState, isError: false };
}
