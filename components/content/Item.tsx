import { lazy, Suspense } from 'react';
import { useUser } from 'lib/user-context';
import Album from './templates/Album';
import Archive from './templates/Archive';
import Latest from './templates/Latest';
import Simple from './templates/Simple';
import Header from './Header';
import Footer from './Footer';
import Comments from './Comments';
import Favorites from './Favorites';
import styles from './content.module.css';

const ContentEditor = lazy(() => import('./ContentEditor'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyContent = any;

const TEMPLATE_MAP: Record<string, React.ComponentType<{ content: AnyContent }>> = {
  album: Album,
  archive: Archive,
  latest: Latest,
  links: Album,
};

export default function Item({
  content,
  contentOwner,
  comments,
  favorites,
  isFeed,
}: {
  content: AnyContent;
  contentOwner: AnyContent;
  comments?: AnyContent[];
  favorites?: AnyContent[];
  isFeed?: boolean;
}) {
  const user = useUser();
  const template = content.template as string;
  const TemplateComponent = TEMPLATE_MAP[template];
  const body = TemplateComponent ? <TemplateComponent content={content} /> : <Simple content={content} />;
  // Every template gets the editor, not just the prose one — a section page is
  // where its own name, template and css are edited.
  const isOwnerViewing = !isFeed && user?.username === content.username;

  return (
    <article className={`hw-item h-entry ${styles.item}`}>
      <Header content={content} disallowEdit={isFeed} />
      {isOwnerViewing ? (
        <Suspense fallback={<div />}>
          <ContentEditor content={contentEditorProps(content)} />
        </Suspense>
      ) : null}
      {TemplateComponent ? body : <div className={styles.innerView}>{body}</div>}
      <Footer content={content} contentOwner={contentOwner} />
      {!isFeed ? <Comments comments={comments} content={content} /> : null}
      {!isFeed && favorites?.length ? <Favorites favorites={favorites} /> : null}
    </article>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function contentEditorProps(content: any) {
  return {
    username: content.username,
    name: content.name,
    section: content.section,
    album: content.album,
    title: content.title || '',
    hidden: !!content.hidden,
    view: content.view,
  };
}
