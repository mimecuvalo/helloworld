import { type FormEvent, type ReactNode, useState } from 'react';
import { F } from 'i18n';
import ContentLink from 'components/ContentLink';
import { buildUrl, profileUrl } from 'lib/url-factory';
import styles from './content.module.css';

type SiteMapItem = {
  username: string;
  section: string;
  album: string;
  name: string;
  title?: string | null;
  forceRefresh?: boolean | null;
  hidden?: boolean | null;
};

type Owner = {
  name?: string | null;
  title?: string | null;
  logo?: string | null;
  license?: string | null;
  sidebarHtml?: string | null;
} | null;

export default function SiteMap({
  siteMap,
  contentOwner,
  content,
  username,
}: {
  siteMap: SiteMapItem[];
  contentOwner: Owner;
  content?: { name: string; album: string; section: string; forceRefresh?: boolean | null } | null;
  username: string;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!siteMap || !contentOwner) return null;

  function generateItem(item: SiteMapItem, albums?: ReactNode) {
    const isSelected = item.name === content?.name || item.name === content?.album || item.name === content?.section;
    const cls = [isSelected ? styles.selected : '', item.hidden ? styles.hidden : ''].filter(Boolean).join(' ');
    return (
      <li key={`${item.section}/${item.name}`} className={cls || undefined}>
        <ContentLink item={item} currentContent={content} className={`notranslate${isSelected ? ' hw-selected' : ''}`}>
          {item.title}
        </ContentLink>
        {albums}
      </li>
    );
  }

  function generateItems(items: SiteMapItem[]) {
    const out: ReactNode[] = [];
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      const nextItem = items[i + 1];
      let albums: ReactNode;
      if (nextItem?.album === 'main') {
        const albumItems: ReactNode[] = [];
        for (i += 1; i < items.length; ++i) {
          const albumItem = items[i];
          if (albumItem.album === 'main') {
            albumItems.push(generateItem(albumItem));
          } else {
            i -= 1;
            break;
          }
        }
        albums = <ul className={styles.album}>{albumItems}</ul>;
      }
      out.push(generateItem(item, albums));
    }
    return out;
  }

  function handleSearchSubmit(evt: FormEvent) {
    evt.preventDefault();
    const form = evt.target as HTMLFormElement;
    const query = (form.elements.namedItem('q') as HTMLInputElement)?.value;
    window.location.href = buildUrl({ pathname: `/${username}/search/${query}` });
  }

  return (
    <>
      <button
        id="hw-hamburger"
        type="button"
        className={`${styles.sitemapToggle} notranslate`}
        aria-label="menu"
        aria-expanded={isDrawerOpen}
        onClick={() => setIsDrawerOpen((open) => !open)}
      >
        {isDrawerOpen ? '✕' : '☰'}
      </button>
      {isDrawerOpen ? (
        <div className={styles.sitemapBackdrop} onClick={() => setIsDrawerOpen(false)} aria-hidden="true" />
      ) : null}
      <nav
        id="hw-sitemap"
        className={`${styles.sitemap} ${isDrawerOpen ? styles.sitemapOpen : ''}`}
        title="sitemap"
        // Following a link out of the mobile drawer should dismiss it — client-side
        // navigation leaves the drawer sitting on top of the page otherwise.
        onClick={(evt) => {
          if (isDrawerOpen && (evt.target as HTMLElement).closest('a')) setIsDrawerOpen(false);
        }}
      >
        <ul>
          {contentOwner.logo ? (
            <li id="hw-sitemap-logo" className={`${styles.logoWrapper} h-card`}>
              <a href={profileUrl(username)} className="u-url u-uid">
                <img
                  className={`${styles.logo} u-photo`}
                  src={contentOwner.logo}
                  title={contentOwner.title || ''}
                  alt={contentOwner.name || username}
                />
              </a>
            </li>
          ) : null}
          <li>
            <a href={profileUrl(username)}>
              <F defaultMessage="home" />
            </a>
          </li>
          {generateItems(siteMap)}
        </ul>

        <search>
          <form
            method="get"
            action="/search"
            onSubmit={handleSearchSubmit}
            className={`${styles.searchForm} notranslate`}
          >
            <input type="search" name="q" placeholder="search" required aria-label="search" />
          </form>
        </search>

        {contentOwner.license ? (
          <div className={`${styles.license} notranslate`}>
            {contentOwner.license === 'http://purl.org/atompub/license#unspecified' ? (
              `Copyright ${new Date().getFullYear()} by ${contentOwner.name}`
            ) : (
              <a href={contentOwner.license} target="_blank" rel="noopener noreferrer">
                license
              </a>
            )}
          </div>
        ) : null}

        {contentOwner.sidebarHtml ? (
          <div className="notranslate" dangerouslySetInnerHTML={{ __html: contentOwner.sidebarHtml }} />
        ) : null}

        <div id="hw-powered-by" className={styles.poweredBy}>
          <F
            defaultMessage="powered by {br} {link}"
            values={{
              br: <br />,
              link: (
                <a href="https://github.com/mimecuvalo/helloworld" rel="generator">
                  Hello, world.
                </a>
              ),
            }}
          />
        </div>
      </nav>
    </>
  );
}
