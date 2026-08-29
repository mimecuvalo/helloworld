import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { uploadImageIntoEditor, type AddedMedia } from './image-upload';

type DropOptions = {
  editor: Editor | null;
  section: string;
  album: string;
  onMediaAdd?: (media: AddedMedia) => void;
  onError?: () => void;
};

// Dropping an image anywhere on the page — not only on the editor — adds it to
// what's being written. Drops that land inside the editor are left alone:
// ProseMirror handles those itself, where the drop position means something.
// Returns whether files are currently being dragged over the page, for the
// overlay that says so.
export default function usePageImageDrop({ editor, section, album, onMediaAdd, onError }: DropOptions) {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  // The listeners are attached once per editor; everything else they need is
  // read back through here, so a change of section mid-drag doesn't detach them.
  const latest = useRef({ section, album, onMediaAdd, onError });
  latest.current = { section, album, onMediaAdd, onError };

  useEffect(() => {
    if (!editor) return;

    // dragenter/dragleave fire for every element the pointer crosses; counting
    // them keeps the overlay from flickering on the way across the page.
    let depth = 0;
    const isInsideEditor = (evt: DragEvent) => evt.target instanceof Node && editor.view.dom.contains(evt.target);
    const isDraggingFiles = (evt: DragEvent) =>
      !editor.isDestroyed && !!evt.dataTransfer?.types.includes('Files') && !isInsideEditor(evt);

    const handleDragEnter = (evt: DragEvent) => {
      if (!isDraggingFiles(evt)) return;
      depth += 1;
      setIsDraggingFile(true);
    };

    const handleDragOver = (evt: DragEvent) => {
      if (!isDraggingFiles(evt)) return;
      // Without this the browser refuses the drop and opens the file instead.
      evt.preventDefault();
      if (evt.dataTransfer) evt.dataTransfer.dropEffect = 'copy';
    };

    const handleDragLeave = (evt: DragEvent) => {
      if (!isDraggingFiles(evt)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) setIsDraggingFile(false);
    };

    const handleDrop = async (evt: DragEvent) => {
      depth = 0;
      setIsDraggingFile(false);
      if (!isDraggingFiles(evt)) return;
      evt.preventDefault();

      const { section, album, onMediaAdd, onError } = latest.current;
      const images = Array.from(evt.dataTransfer?.files || []).filter((file) => file.type.startsWith('image/'));
      for (const file of images) {
        if (editor.isDestroyed) return;
        // Dropped away from the editor there's no position to speak of, so the
        // image lands after everything written so far.
        const image = await uploadImageIntoEditor(editor, file, {
          section,
          album,
          pos: editor.state.doc.content.size,
        });
        if (image) onMediaAdd?.({ thumb: image.thumb, lqip: image.lqip });
        else onError?.();
      }
      if (images.length && !editor.isDestroyed) editor.commands.focus('end');
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [editor]);

  return isDraggingFile;
}
