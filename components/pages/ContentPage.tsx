import 'styles/content-theme.css';
import 'lite-youtube-embed/src/lite-yt-embed.css';
import { useEffect, useRef } from 'react';
import { useRouter } from '@tanstack/react-router';
import { themeGlobalCss } from 'styles/theme-css';
import type { ContentPageData } from 'lib/page-data';
import { contentUrl } from 'lib/url-factory';
import { useGestures } from 'lib/use-gestures';
import { UserProvider } from 'lib/user-context';
import { EditorProvider } from 'lib/editor-context';
import SiteMap from 'components/content/SiteMap';
import Nav from 'components/content/Nav';
import Item from 'components/content/Item';
import Feed from 'components/content/Feed';
import Simple from 'components/content/templates/Simple';
import ContentHeadScripts from 'components/content/ContentHeadScripts';
import styles from 'components/content/content.module.css';

// Themed content viewer — per-user theme + template dispatch:
//   blank → bare Simple body (no chrome)
//   feed  → SiteMap + Nav + paginated Feed
//   else  → SiteMap + Nav + Item (Header / body / Footer / Comments / Favorites)
export default function ContentPage({ data }: { data: ContentPageData }) {
  const router = useRouter();
  const itemRef = useRef<HTMLElement>(null);
  const navRef = useRef<{ prev: () => void; next: () => void }>(null);
  const { content, contentOwner, comments, favorites, siteMap, neighbors, currentUsername } = data;
  const theme = (contentOwner?.theme as string) || 'nightlight';
  const skin = themeGlobalCss[theme] ?? '';
  const username = content?.username || (contentOwner as { username?: string } | null)?.username || '';
  const template = (content as { template?: string } | null)?.template;

  // Register the <lite-youtube> web component client-side (the loader already
  // rewrote youtube iframes → <lite-youtube> in the SSR markup).
  useEffect(() => {
    import('lite-youtube-embed/src/lite-yt-embed.js' as string);
  }, []);

  useEffect(() => {
    if (!content) return;
    const canonical = contentUrl(content);
    if (canonical && window.location.pathname !== new URL(canonical, window.location.origin).pathname) {
      router.navigate({ to: canonical, replace: true });
    }
  }, [content, router]);

  // Same gesture handling as the album lightbox, so a swipe means the same thing
  // in both views. Only single photos inside an album are navigable this way.
  const isSwipeablePhoto = content?.section === 'photos' && content.album !== 'main';
  useGestures(
    itemRef,
    {
      onSwipeLeft: () => isSwipeablePhoto && navRef.current?.next(),
      onSwipeRight: () => isSwipeablePhoto && navRef.current?.prev(),
    },
    [content]
  );

  const title = (content?.title ? content.title + ' – ' : '') + (contentOwner?.title ?? '') || 'hello, world.';

  const wrap = (children: React.ReactNode) => (
    <UserProvider user={currentUsername ? { username: currentUsername } : null}>
      <EditorProvider>
        <div className="hw-content-theme" data-theme={theme}>
          {skin ? <style dangerouslySetInnerHTML={{ __html: skin }} /> : null}
          <ContentHeadScripts content={content} contentOwner={contentOwner} host={data.host} title={title} />
          {children}
        </div>
      </EditorProvider>
    </UserProvider>
  );

  if (!content) {
    return wrap(
      <main id="hw-content" className={styles.main}>
        <p style={{ padding: '2rem' }}>Not found.</p>
      </main>
    );
  }

  // Blank template: standalone body, no sidebar/nav/chrome.
  if (template === 'blank') {
    return wrap(
      <main id="hw-content">
        <Simple content={content} />
      </main>
    );
  }

  return wrap(
    <div className={styles.layout}>
      <SiteMap siteMap={siteMap} contentOwner={contentOwner} content={content} username={username} />

      <main ref={itemRef} id="hw-content" className={styles.main}>
        <Nav ref={navRef} content={content} neighbors={neighbors} />
        {template === 'feed' ? (
          <Feed content={content} contentOwner={contentOwner} />
        ) : (
          <Item content={content} contentOwner={contentOwner} comments={comments} favorites={favorites} />
        )}
      </main>
    </div>
  );
}
