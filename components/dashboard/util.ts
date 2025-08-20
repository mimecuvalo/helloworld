import { Editor } from '@tiptap/react';
import mime from 'mime/lite';

const IFRAME_ALLOW = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';

export async function unfurl(url: string) {
  if (url.match(/^<iframe /)) {
    const iframe = {
      src: url.match(/src=['"]([^'"]+)['"]/)?.[1],
      width: url.match(/width=['"]([^'"]+)['"]/)?.[1] || 400,
      height: url.match(/height=['"]([^'"]+)['"]/)?.[1] || 300,
      frameBorder: 0,
      allow: url.match(/allow=['"]([^'"]+)['"]/)?.[1] || IFRAME_ALLOW,
    };

    return {
      result: `<iframe ${Object.entries(iframe)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')}></iframe>`,
      isError: false,
      wasMediaFound: true,
      isImg: false,
      image: '',
      title: '',
    };
  }

  if (mime.getType(url)?.match(/^image\//)) {
    return {
      result: `<img src="${url}" alt="" />`,
      isError: false,
      wasMediaFound: true,
      isImg: true,
      image: url,
      title: '',
    };
  }

  let response;
  try {
    response = await fetch('/api/unfurl', {
      method: 'POST',
      body: JSON.stringify({
        url,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    return { result: '', isError: true, wasMediaFound: false, isImg: false, image: '', title: '' };
  }

  const json: any = await response.json();
  let image = '';
  let isImg = false;
  let result = '';
  const title = json.title;
  if (json.wasMediaFound) {
    if (json.iframe) {
      result = `<iframe ${Object.entries(json.iframe)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')}></iframe>`;
      image = json.image;
    } else {
      result = `<img src="${json.image}" alt="${json.title || ''}" />`;
      isImg = true;
      image = json.image;
    }
  }

  return { result, isError: false, wasMediaFound: json.wasMediaFound, isImg, image, title };
}

export async function reblog(editor: Editor, imageOrText: string, url?: string) {
  if (!editor) return;

  const unfurlInfo = await unfurl(imageOrText);

  await editor.commands.insertContent(`<h1>${unfurlInfo.title}</h1>`);

  if (unfurlInfo.isImg) {
    await editor.commands.setTextSelection(editor.state.doc.content.size);
    await editor.commands.setImage({
      src: unfurlInfo.image,
      alt: unfurlInfo.title,
    });
  }

  if (url) {
    await editor.commands.setTextSelection(editor.state.doc.content.size);
    await editor.commands.insertContent(`<br><a href="${url}">${url}</a>`);
  }
}
