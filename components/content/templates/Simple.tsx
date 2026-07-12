import { lazy, Suspense } from 'react';
import { useUser } from 'lib/user-context';
import { useEditor } from 'lib/editor-context';
import styles from '../content.module.css';

const ContentEditor = lazy(() => import('../ContentEditor'));

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
  const user = useUser();
  const { isEditing } = useEditor();
  const isOwnerViewing = user?.username === content.username;

  return (
    <>
      {isOwnerViewing ? (
        <Suspense fallback={<div />}>
          <ContentEditor
            content={{
              username: content.username,
              name: content.name,
              section: content.section,
              album: content.album,
              title: content.title || '',
              hidden: !!content.hidden,
              view: content.view,
            }}
          />
        </Suspense>
      ) : null}

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
