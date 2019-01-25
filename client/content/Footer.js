import { contentUrl } from '../../shared/util/url_factory';
import { F, FormattedDate } from '../../shared/i18n';
import React, { PureComponent } from 'react';
import styles from './Footer.module.css';

class Footer extends PureComponent {
  render() {
    const content = this.props.content;

    return (
      <footer className={styles.footer}>
        <F
          msg="{username} posted {date}"
          values={{
            username: content.username,
            date: (
              <time dateTime={content.date_created}>
                <FormattedDate
                  value={content.date_created}
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
        {content.date_updated &&
          content.date_updated !== content.date_created && (
            <>
              &nbsp;
              <F
                msg="(updated {date})"
                values={{
                  date: (
                    <time dateTime={content.date_updated}>
                      <FormattedDate
                        value={content.date_updated}
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
        <a href={contentUrl(content)} target="_blank" rel="noopener noreferrer">
          <F msg="permalink" />
        </a>
        &nbsp;•&nbsp;
        <a href="#fullscreen" onClick={this.handleFullscreen}>
          <F msg="fullscreen" />
        </a>
        &nbsp;•&nbsp;
        <F
          msg="{count, plural, =0 {no human views} one {# human view} other {# human views}}"
          values={{ count: content.count }}
        />
        &nbsp;•&nbsp;
        <F
          msg="{count, plural, =0 {no robot views} one {# robot view} other {# robot views}}"
          values={{ count: content.count_robot }}
        />
        {/* <CommentEntry /> TODO(mime) */}
        {/* <Comments /> TODO(mime) */}
      </footer>
    );
  }
}

export default Footer;
