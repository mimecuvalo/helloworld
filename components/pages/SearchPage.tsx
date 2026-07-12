import 'styles/content-theme.css';
import { themeGlobalCss } from 'styles/theme-css';
import type { SearchPageData } from 'lib/page-data';
import { UserProvider } from 'lib/user-context';
import { defineMessages, useIntl } from 'i18n';
import ContentLink from 'components/ContentLink';
import SiteMap from 'components/content/SiteMap';
import { thumbUrl } from 'lib/url-factory';
import styles from 'components/content/content.module.css';

const messages = defineMessages({
  search: { defaultMessage: 'search' },
  untitled: { defaultMessage: 'untitled' },
});

function Highlight({ str, term }: { str: string; term: string }) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return (
    <>
      {str
        .split(regex)
        .filter(Boolean)
        .map((part, index) => (part.match(regex) ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>))}
    </>
  );
}

export default function SearchPage({ data }: { data: SearchPageData }) {
  const intl = useIntl();
  const { results, contentOwner, siteMap, query, currentUsername } = data;
  const theme = (contentOwner?.theme as string) || 'nightlight';
  const skin = themeGlobalCss[theme] ?? '';
  const username = (contentOwner as { username?: string } | null)?.username || '';
  const untitled = intl.formatMessage(messages.untitled);

  return (
    <UserProvider user={currentUsername ? { username: currentUsername } : null}>
      <div className="hw-content-theme" data-theme={theme}>
        {skin ? <style dangerouslySetInnerHTML={{ __html: skin }} /> : null}

        <div className={styles.layout}>
          <SiteMap siteMap={siteMap} contentOwner={contentOwner} content={null} username={username} />

          <main id="hw-content" className={styles.main}>
            <h1>{intl.formatMessage(messages.search)}</h1>
            <ol className={styles.searchList}>
              {results.map((item) => (
                <li key={`${item.section}/${item.name}`} className={styles.searchItem}>
                  {item.thumb ? <img className={styles.searchThumb} src={thumbUrl(item.thumb)} alt="" /> : null}
                  <div>
                    <ContentLink item={item} className="notranslate">
                      <Highlight str={item.title || untitled} term={query} />
                    </ContentLink>
                    <div className={`${styles.searchPreview} notranslate`}>
                      <Highlight str={(item as { preview?: string }).preview || ''} term={query} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
