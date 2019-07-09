import { buildUrl } from '../utils/url_factory';
import { createNewBlock } from '../utils/Blocks';

export default async function uploadFiles(onMediaUpload, editorState, files) {
  if (!onMediaUpload) {
    console.error(`Editor doesn't have onMediaUpload set to provide uploading of media.`);
    return { isError: true };
  }

  const body = new FormData();
  for (const file of files) {
    body.append('files', file, file.name);
  }

  let response;
  try {
    response = await onMediaUpload(body);
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

    editorState = createNewBlock('IMAGE', 'img', editorState, { href, src, alt }, { href, src, alt });
  }

  return { editorState, fileInfos, isError: false };
}
