import { buildUrl } from '../../../shared/util/url_factory';
import configuration from '../../app/configuration';
import { createNewBlock } from '../utils/Blocks';

export default async function uploadFiles(editorState, files) {
  const body = new FormData();
  for (const file of files) {
    body.append('files', file, file.name);
  }

  let response;
  try {
    response = await fetch(buildUrl({ pathname: '/api/upload' }), {
      method: 'POST',
      body,
      headers: { 'x-csrf-token': configuration.csrf },
    });
  } catch (ex) {
    return { isError: true };
  }

  const editorStateAndInfo = await handleUploadComplete(editorState, response);

  return editorStateAndInfo;
}

async function handleUploadComplete(editorState, response) {
  const fileInfos = await response.json();

  for (const fileInfo of fileInfos) {
    if (fileInfo.isError) {
      return { editorState, isError: true };
    }

    const href = fileInfo.original;
    const src = fileInfo.normal;
    const alt = '';

    editorState = createNewBlock('IMAGE', 'img', editorState, { src, alt }, { href, src, alt });
  }

  return { editorState, fileInfos, isError: false };
}
