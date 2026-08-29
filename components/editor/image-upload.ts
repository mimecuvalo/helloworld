import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/react';
import { uploadImageToS3, type UploadedImage } from 'lib/s3-upload';

// What a post takes from an image added to it, when it hasn't got a thumbnail
// of its own yet: the small size, and the placeholder that stands in for it.
export type AddedMedia = { thumb: string; lqip: number | null };
import styles from './editor.module.css';

type PlaceholderAction = { add?: { id: number; pos: number; dataUrl: string }; remove?: number };

const placeholderKey = new PluginKey<DecorationSet>('imageUploadPlaceholder');

let nextPlaceholderId = 0;

// The image being uploaded, shown dimmed at the spot it will land in. It lives
// in a decoration rather than in the document so the data url never reaches
// getHTML() — a post saved mid-upload would otherwise carry the whole file.
export const ImageUploadPlaceholder = Extension.create({
  name: 'imageUploadPlaceholder',

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: placeholderKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set) {
            let next = set.map(tr.mapping, tr.doc);
            const action = tr.getMeta(placeholderKey) as PlaceholderAction | undefined;
            if (action?.add) {
              const image = document.createElement('img');
              image.src = action.add.dataUrl;
              image.className = styles.uploadingImage;
              image.alt = '';
              next = next.add(tr.doc, [Decoration.widget(action.add.pos, image, { id: action.add.id })]);
            }
            const removed = action?.remove;
            if (removed !== undefined) {
              next = next.remove(next.find(undefined, undefined, (spec) => spec.id === removed));
            }
            return next;
          },
        },
        props: {
          decorations: (state) => placeholderKey.getState(state),
        },
      }),
    ];
  },
});

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

// Where the placeholder ended up: whatever was typed while the upload was in
// flight has moved it along.
function placeholderPos(editor: Editor, id: number) {
  const found = placeholderKey.getState(editor.state)?.find(undefined, undefined, (spec) => spec.id === id);
  return found?.length ? found[0].from : null;
}

// Uploads a file and drops the image it becomes into the editor, showing the
// local copy in its place until the urls come back. What lands in the post is
// the medium size, linked to the untouched original and carrying the
// placeholder that stands in for it while it loads. Returns the three sizes, or
// null if the upload failed or the editor went away while it was running.
export async function uploadImageIntoEditor(
  editor: Editor,
  file: File,
  { section, album, pos }: { section: string; album: string; pos?: number }
): Promise<UploadedImage | null> {
  const id = ++nextPlaceholderId;
  const dataUrl = await readDataUrl(file).catch(() => '');
  if (editor.isDestroyed) return null;

  const clamp = (at: number) => Math.min(Math.max(at, 0), editor.state.doc.content.size);
  const droppedAt = clamp(pos ?? editor.state.selection.anchor);
  if (dataUrl) {
    editor.view.dispatch(editor.state.tr.setMeta(placeholderKey, { add: { id, pos: droppedAt, dataUrl } }));
  }

  let image: UploadedImage | null = null;
  try {
    image = await uploadImageToS3(file, file.name, section, album);
  } catch {
    image = null;
  }
  if (editor.isDestroyed) return null;

  const tr = editor.state.tr.setMeta(placeholderKey, { remove: id });
  if (image) {
    tr.insert(
      clamp(placeholderPos(editor, id) ?? droppedAt),
      // Width and height only when they're known — an <img width="0"> is a
      // hidden image, which is worse than one that reserves no space.
      editor.schema.nodes.image.create({
        src: image.medium,
        original: image.original !== image.medium ? image.original : null,
        lqip: image.lqip,
        width: image.width || null,
        height: image.height || null,
      })
    );
  }
  editor.view.dispatch(tr);

  return image;
}
