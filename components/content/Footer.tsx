import { F, FormattedDate } from 'i18n';
import { contentUrl, profileUrl } from 'lib/url-factory';
import styles from './content.module.css';

type FooterContent = {
  username: string;
  section: string;
  album: string;
  name: string;
  count: number;
  countRobot: number;
  createdAt: string | Date;
  thread?: string | null;
};

type Owner = { name?: string | null; logo?: string | null; favicon?: string | null } | null;

export default function Footer({ content, contentOwner }: { content: FooterContent; contentOwner: Owner }) {
  const { count, countRobot, createdAt, username } = content;
  const name = contentOwner?.name || username;

  return (
    <footer className={styles.footer}>
      <span className="p-author h-card" style={{ display: 'flex', alignItems: 'center' }}>
        <a href={profileUrl(username)} className="u-url u-uid" style={{ marginRight: 8 }}>
          <img
            className={`u-photo ${styles.footerAvatar}`}
            src={contentOwner?.logo || contentOwner?.favicon || '/img/pixel.gif'}
            alt={name}
          />
        </a>
        <a href={profileUrl(username)} className="p-name fn u-url u-uid url notranslate">
          {name}
        </a>
      </span>
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <a href={contentUrl(content)}>
        <time className="t-published" dateTime={String(createdAt)}>
          <FormattedDate value={createdAt} year="2-digit" month="2-digit" day="2-digit" />
        </time>
      </a>
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <F
        defaultMessage="{count, plural, =0 {no human views} one {# human view} other {# human views}}"
        values={{ count }}
      />
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <F
        defaultMessage="{count, plural, =0 {no robot views} one {# robot view} other {# robot views}}"
        values={{ count: countRobot }}
      />
      {content.thread ? (
        <>
          <span className="notranslate">&nbsp;•&nbsp;</span>
          <a href={content.thread} target="_blank" rel="noopener noreferrer">
            <F defaultMessage="view thread" />
          </a>
        </>
      ) : null}
    </footer>
  );
}
