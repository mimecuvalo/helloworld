import { contentUrl, profileUrl } from '../../shared/util/url_factory';
import { createUseStyles } from 'react-jss';
import { F, FormattedDate } from 'react-intl-wrapper';
import React from 'react';

const useStyles = createUseStyles({
  footer: {
    fontSize: '11px',
    margin: '6px 6px 24px 0',
    borderTop: '1px solid #0bf',
    padding: '3px 6px 6px 3px',
    '& img': {
      width: '16px',
      height: '16px',
      marginRight: '5px',
      marginTop: '-2px',
    },
  },
});

export default function Footer({ content, contentOwner }) {
  const { count, count_robot, createdAt, updatedAt, username } = content;
  const name = contentOwner.name || username;
  const styles = useStyles();

  const handleFullscreen = evt => {
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
        msg="posted on {date}"
        values={{
          date: (
            <time className="t-published" dateTime={createdAt}>
              <FormattedDate
                value={createdAt}
                year="numeric"
                month="long"
                day="2-digit"
                hour="2-digit"
                minute="2-digit"
              />
            </time>
          ),
        }}
      />
      {updatedAt && updatedAt !== createdAt && (
        <>
          &nbsp;
          <F
            msg="(updated {date})"
            values={{
              date: (
                <time className="t-updated" dateTime={updatedAt}>
                  <FormattedDate
                    value={updatedAt}
                    year="numeric"
                    month="long"
                    day="2-digit"
                    hour="2-digit"
                    minute="2-digit"
                  />
                </time>
              ),
            }}
          />
        </>
      )}
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <a href={contentUrl(content)} target="_blank" rel="bookmark noopener noreferrer">
        <F msg="permalink" />
      </a>
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <button className="hw-button-link" onClick={handleFullscreen}>
        <F msg="fullscreen" />
      </button>
      <span className="notranslate">&nbsp;•&nbsp;</span>
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
