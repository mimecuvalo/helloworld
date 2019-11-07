import { contentUrl, profileUrl } from '../../shared/util/url_factory';
import { F, FormattedDate } from '../../shared/i18n';
import React, { PureComponent } from 'react';
import styles from './Footer.module.css';

export default class Footer extends PureComponent {
  handleFullscreen = evt => {
    document.getElementById('hw-content').requestFullscreen();
  };

  render() {
    const { content, contentOwner } = this.props;
    const { count, count_robot, createdAt, updatedAt, username } = content;
    const name = contentOwner.name || username;

    return (
      <footer className={styles.footer}>
        <span className="p-author h-card">
          <a key="img" href={profileUrl(username)} className="u-url u-uid icon-container">
            <img className="u-photo" src={contentOwner.logo || contentOwner.favicon} alt={name} />
          </a>
          <a key="name" href={profileUrl(username)} className="p-name fn u-url u-uid url">
            {name}
          </a>
        </span>
        :&nbsp;
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
        &nbsp;•&nbsp;
        <a href={contentUrl(content)} target="_blank" rel="bookmark noopener noreferrer">
          <F msg="permalink" />
        </a>
        &nbsp;•&nbsp;
        <button className="hw-button-link" onClick={this.handleFullscreen}>
          <F msg="fullscreen" />
        </button>
        &nbsp;•&nbsp;
        <F
          msg="{count, plural, =0 {no human views} one {# human view} other {# human views}}"
          values={{ count: count }}
        />
        &nbsp;•&nbsp;
        <F
          msg="{count, plural, =0 {no robot views} one {# robot view} other {# robot views}}"
          values={{ count: count_robot }}
        />
        {content.thread ? (
          <>
            &nbsp;•&nbsp;
            <a href={content.thread} target="_blank" rel="noopener noreferrer">
              <F msg="view thread" />
            </a>
          </>
        ) : null}
      </footer>
    );
  }
}
