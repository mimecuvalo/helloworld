import { F } from 'i18n';
import ContentLink from 'components/ContentLink';
import { useCollection } from 'lib/content-queries';
import styles from '../content.module.css';

type ArchiveContent = {
  username: string;
  section: string;
  album: string;
  name: string;
  forceRefresh?: boolean | null;
};

export default function Archive({ content }: { content: ArchiveContent }) {
  const { username, section, album, name } = content;
  const { data, isPending } = useCollection({ username, section, album, name });

  if (isPending) return <div className={styles.loadingBox} />;

  const collection = data || [];

  return (
    <ul className={styles.archive}>
      {!collection.length ? (
        <li>
          <F defaultMessage="No content here yet." />
        </li>
      ) : null}
      {collection
        .filter((item) => item.name !== content.name)
        .map((item) => (
          <li key={item.name}>
            <ContentLink item={item} currentContent={content}>
              {item.title}
            </ContentLink>
          </li>
        ))}
    </ul>
  );
}
