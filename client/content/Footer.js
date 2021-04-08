import { F, FormattedDate } from 'react-intl-wrapper';
import { contentUrl, profileUrl } from 'shared/util/url_factory';

import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  footer: {
    position: 'sticky',
    bottom: -1, // XXX: chrome has a bit of a problem here with content leaking out
    background: '#111',
    zIndex: 1,

    fontSize: '11px',
    color: '#666',
    borderTop: '1px solid #ccc',
    padding: '6px 10px',
    '& img': {
      float: 'left',
      width: '16px',
      height: '16px',
      marginRight: '10px',
      marginTop: 2,
    },
  },
});

export default function Footer({ content, contentOwner }) {
  const { count, count_robot, createdAt, updatedAt, username } = content;
  const name = contentOwner.name || username;
  const styles = useStyles();

  const handleFullscreen = (evt) => {
    document.getElementById('hw-content').requestFullscreen();
  };

  return (
    <footer className={styles.footer}>
      <span className="p-author h-card">
        <a key="img" href={profileUrl(username)} className="u-url u-uid icon-container">
          <img className="u-photo" src={contentOwner.logo || contentOwner.favicon} alt={name} />
        </a>
        <a key="name" href={profileUrl(username)} className="p-name fn u-url u-uid url notranslate">
          {name}
        </a>
      </span>
      <span className="notranslate">:&nbsp;</span>
      <F
        msg="posted {date}"
        values={{
          date: (
            <time className="t-published" dateTime={createdAt}>
              <FormattedDate value={createdAt} year="2-digit" month="2-digit" day="2-digit" />
            </time>
          ),
        }}
      />
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <a href={contentUrl(content)} target="_blank" rel="bookmark noopener noreferrer">
        <F msg="permalink" />
      </a>
      <span className="notranslate">&nbsp;•</span>
      <button className="hw-button-link" onClick={handleFullscreen}>
        <F msg="fullscreen" />
      </button>
      <span className="notranslate">•&nbsp;</span>
      <F
        msg="{count, plural, =0 {no human views} one {# human view} other {# human views}}"
        values={{ count: count }}
      />
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <F
        msg="{count, plural, =0 {no robot views} one {# robot view} other {# robot views}}"
        values={{ count: count_robot }}
      />
      {content.thread ? (
        <>
          <span className="notranslate">&nbsp;•&nbsp;</span>
          <a href={content.thread} target="_blank" rel="noopener noreferrer">
            <F msg="view thread" />
          </a>
        </>
      ) : null}
    </footer>
  );
}
