import type { Editor } from '@tiptap/react';
import mime from 'mime/lite';

const IFRAME_ALLOW = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';

export type UnfurlInfo = {
  result: string;
  isError: boolean;
  wasMediaFound: boolean;
  isImg: boolean;
  image: string;
  title: string;
};

// A paste worth unfurling: a bare url, or embed code copied off another site.
export function isUnfurlable(text: string) {
  return !!(text.match(/^https?:\/\//) || text.match(/^<iframe /));
}

function escapeHTML(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function unfurl(url: string): Promise<UnfurlInfo> {
  if (url.match(/^<iframe /)) {
    const iframe = {
      src: url.match(/src=['"]([^'"]+)['"]/)?.[1],
      width: url.match(/width=['"]([^'"]+)['"]/)?.[1] || 400,
      height: url.match(/height=['"]([^'"]+)['"]/)?.[1] || 300,
      frameborder: 0,
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
      result: `<img src="${escapeHTML(url)}" alt="" />`,
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
  const title = json.title || '';
  if (json.wasMediaFound) {
    if (json.iframe) {
      result = `<iframe ${Object.entries(json.iframe)
        .filter(([, v]) => v !== '' && v !== null && v !== undefined)
        .map(([k, v]) => `${k.toLowerCase()}="${escapeHTML(String(v))}"`)
        .join(' ')}></iframe>`;
      image = json.image;
    } else {
      result = `<img src="${escapeHTML(json.image)}" alt="${escapeHTML(title)}" />`;
      isImg = true;
      image = json.image;
    }
  }

  return { result, isError: false, wasMediaFound: json.wasMediaFound, isImg, image, title };
}

// Drops an unfurled embed in at the caret, followed by a link back to the
// source. Falls back to plain link/text when there was no media to embed, so a
// paste is never swallowed.
export function insertUnfurlInfo(editor: Editor, info: UnfurlInfo, text: string, sourceUrl?: string) {
  const link = sourceUrl || (text.match(/^https?:\/\//) ? text : '');
  const anchor = link ? `<p><a href="${escapeHTML(link)}">${escapeHTML(link)}</a></p>` : '';

  if (info.isError || !info.wasMediaFound) {
    editor.commands.insertContent(anchor || text);
    return;
  }

  editor.commands.insertContent([info.title ? `<h1>${escapeHTML(info.title)}</h1>` : '', info.result, anchor].join(''));
}

export async function insertUnfurl(editor: Editor, text: string, sourceUrl?: string): Promise<UnfurlInfo> {
  const info = await unfurl(text);
  if (!editor.isDestroyed) insertUnfurlInfo(editor, info, text, sourceUrl);
  return info;
}
