import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/react';
import { uploadImageToS3, type UploadedImage } from 'lib/s3-upload';

// What a post takes from an image added to it, when it hasn't got a thumbnail
// of its own yet: the small size, and the placeholder that stands in for it.
export type AddedMedia = { thumb: string; lqip: number | null };
import styles from './editor.module.css';

type PlaceholderAction = {
  add?: { id: number; pos: number; dataUrl: string };
  remove?: number;
  move?: { ids: number[]; pos: number };
};

function placeholderWidget(pos: number, id: number, dataUrl: string) {
  const image = document.createElement('img');
  image.src = dataUrl;
  image.className = styles.uploadingImage;
  image.alt = '';
  return Decoration.widget(pos, image, { id, dataUrl });
}

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
            const action = tr.getMeta(placeholderKey) as PlaceholderAction | undefined;
            // Placeholders being moved are taken out before mapping: the image
            // they're making way for can replace the spot they sit on, and
            // mapping would drop them along with it.
            const move = action?.move;
            const moving = move ? set.find(undefined, undefined, (spec) => move.ids.includes(spec.id)) : [];
            // (remove() blanks out the array it is handed, so it gets a copy.)
            let next = set.remove([...moving]).map(tr.mapping, tr.doc);
            if (move && moving.length) {
              moving.sort((a, b) => move.ids.indexOf(a.spec.id) - move.ids.indexOf(b.spec.id));
              next = next.add(
                tr.doc,
                moving.map((deco) => placeholderWidget(move.pos, deco.spec.id, deco.spec.dataUrl))
              );
            }
            if (action?.add) {
              next = next.add(tr.doc, [placeholderWidget(action.add.pos, action.add.id, action.add.dataUrl)]);
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

// Uploads files and drops the images they become into the editor, showing the
// local copies in their place until the urls come back. What lands in the post
// is the medium size, linked to the untouched original and carrying the
// placeholder that stands in for it while it loads. The uploads run side by
// side, but the images go in in the order given, each one taking the
// placeholders still waiting along to just after it. Resolves to each file's
// three sizes, or null where the upload failed or the editor went away.
export async function uploadImagesIntoEditor(
  editor: Editor,
  files: File[],
  { section, album, pos }: { section: string; album: string; pos?: number }
): Promise<(UploadedImage | null)[]> {
  const dataUrls = await Promise.all(files.map((file) => readDataUrl(file).catch(() => '')));
  if (editor.isDestroyed) return files.map(() => null);

  const clamp = (at: number) => Math.min(Math.max(at, 0), editor.state.doc.content.size);
  const droppedAt = clamp(pos ?? editor.state.selection.anchor);
  const ids = files.map(() => ++nextPlaceholderId);
  // The plugin reads one action per transaction, so each placeholder goes in on its own.
  ids.forEach((id, i) => {
    if (!dataUrls[i]) return;
    editor.view.dispatch(
      editor.state.tr.setMeta(placeholderKey, { add: { id, pos: droppedAt, dataUrl: dataUrls[i] } })
    );
  });

  const uploads = files.map((file) => uploadImageToS3(file, file.name, section, album).catch(() => null));
  const results: (UploadedImage | null)[] = [];
  for (const [i, upload] of uploads.entries()) {
    const image = await upload;
    if (editor.isDestroyed) return [...results, ...files.slice(i).map(() => null)];

    const tr = editor.state.tr;
    const action: PlaceholderAction = { remove: ids[i] };
    if (image) {
      tr.insert(
        clamp(placeholderPos(editor, ids[i]) ?? droppedAt),
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
      let end = 0;
      tr.mapping.maps[tr.mapping.maps.length - 1]?.forEach((_from, _to, _newFrom, newTo) => (end = newTo));
      action.move = { ids: ids.slice(i + 1), pos: end };
    }
    editor.view.dispatch(tr.setMeta(placeholderKey, action));
    results.push(image);
  }
  return results;
}
