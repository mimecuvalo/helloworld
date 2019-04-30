import { F, FormattedDate } from '../../shared/i18n';
import Favorite from './actions/Favorite';
import KeepUnread from './actions/KeepUnread';
import React, { PureComponent } from 'react';
import Reblog from './actions/Reblog';
import Reply from './actions/Reply';
import styles from './Footer.module.css';

class Footer extends PureComponent {
  render() {
    const contentRemote = this.props.contentRemote;
    const { createdAt, link, updatedAt, username } = contentRemote;

    return (
      <footer className={styles.footer}>
        <div className={styles.info}>
          <a className={styles.permalink} href={link} target="_blank" rel="noopener noreferrer">
            <F
              msg="{username} posted on {date}"
              values={{
                username: username,
                date: (
                  <time dateTime={createdAt}>
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
            {updatedAt &&
              updatedAt !== createdAt && (
                <>
                  &nbsp;
                  <F
                    msg="(updated {date})"
                    values={{
                      date: (
                        <time dateTime={updatedAt}>
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
          </a>
        </div>
        <div className={styles.actions}>
          <Reblog contentRemote={contentRemote} getEditor={this.props.getEditor} />
          &nbsp;•&nbsp;
          <Favorite contentRemote={contentRemote} isDashboard={true} />
          &nbsp;•&nbsp;
          <KeepUnread keepUnreadCb={this.props.keepUnreadCb} contentRemote={contentRemote} />
          &nbsp;•&nbsp;
          <Reply contentRemote={contentRemote} />
        </div>
      </footer>
    );
  }
}

export default Footer;
