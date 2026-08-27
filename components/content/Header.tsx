import { F } from 'i18n';
import ContentLink from 'components/ContentLink';
import { useUser } from 'lib/user-context';
import { useEditor } from 'lib/editor-context';
import styles from './content.module.css';

type HeaderContent = {
  title?: string | null;
  forceRefresh?: boolean | null;
  hidden?: boolean | null;
  username: string;
  section: string;
  album: string;
  name: string;
};

export default function Header({ content, disallowEdit }: { content: HeaderContent; disallowEdit?: boolean }) {
  const user = useUser();
  const { isEditing, setIsEditing } = useEditor();
  const isOwnerViewing = user?.username === content.username;

  if (!content.title && !isOwnerViewing) {
    return null;
  }

  return (
    <header className={styles.itemHeader} title={content.title || undefined}>
      <h1 className={styles.itemTitle}>
        <ContentLink item={content} currentContent={content}>
          <span className="p-name notranslate">{content.title || <F defaultMessage="Untitled" />}</span>
          {isOwnerViewing && content.hidden ? (
            <>
              &nbsp;
              <F defaultMessage="(hidden)" />
            </>
          ) : null}
        </ContentLink>

        {isOwnerViewing && !disallowEdit ? (
          <button
            type="button"
            className={`${styles.editButton} ${isEditing ? styles.editButtonActive : ''}`}
            onClick={() => setIsEditing(!isEditing)}
            aria-pressed={isEditing}
          >
            <F defaultMessage="edit" />
          </button>
        ) : null}
      </h1>
    </header>
  );
}
