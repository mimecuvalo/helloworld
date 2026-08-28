import { useEditor } from 'lib/editor-context';
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

  return (
    <>
      {isEditing ? null : (
        <>
          {!isFeed && content.style ? <div dangerouslySetInnerHTML={{ __html: content.style }} /> : null}
          {!isFeed && content.code ? <div dangerouslySetInnerHTML={{ __html: content.code }} /> : null}
          <div
            className={`e-content hw-view notranslate ${styles.simpleView}`}
            dangerouslySetInnerHTML={{ __html: content.view }}
          />
        </>
      )}
    </>
  );
}
