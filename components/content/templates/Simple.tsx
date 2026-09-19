import { useRef } from 'react';
import { useEditor, usePendingContent } from 'lib/editor-context';
import { useImageLightbox } from '../use-image-lightbox';
import styles from '../content.module.css';

type SimpleContent = {
  username: string;
  name: string;
  section: string;
  album: string;
  title?: string | null;
  hidden?: boolean | null;
  view: string;
  style?: string | null;
  code?: string | null;
};

export default function Simple({ content, isFeed }: { content: SimpleContent; isFeed?: boolean }) {
  // The editor itself lives in Item, one level up, so that templates without a
  // prose body (albums, archives) get it too. Here we just stay out of its way.
  const { isEditing } = useEditor();
  // A just-saved body, shown while the save is in flight — `content` here is
  // still the copy the page loaded before the edit. Style and code stay as
  // loaded: what the page renders has the section's and album's css/js folded
  // into it, which the editor's own copy doesn't have.
  const pending = usePendingContent(content);
  const viewRef = useRef<HTMLDivElement>(null);
  // Same lightbox the album uses, over whatever images the post body happens to
  // contain — they're just markup here rather than thumbs we rendered. The view
  // goes away entirely while the editor is up, so the bind has to follow it.
  // A pending body swapping in is just another DOM change, which the hook
  // re-scans for on its own.
  const lightbox = useImageLightbox(viewRef, [isEditing]);

  return (
    <>
      {isEditing ? null : (
        <>
          {!isFeed && content.style ? <div dangerouslySetInnerHTML={{ __html: content.style }} /> : null}
          {!isFeed && content.code ? <div dangerouslySetInnerHTML={{ __html: content.code }} /> : null}
          <div
            ref={viewRef}
            className={`e-content hw-view notranslate ${styles.simpleView}`}
            dangerouslySetInnerHTML={{ __html: pending ? pending.view : content.view }}
          />
          {lightbox}
        </>
      )}
    </>
  );
}
