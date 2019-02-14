import { F, FormattedDate } from '../../shared/i18n';
import { Favorite } from './Actions';
import React, { PureComponent } from 'react';
import styles from './Footer.module.css';

class Footer extends PureComponent {
  render() {
    const contentRemote = this.props.contentRemote;
    const { createdAt, link, updatedAt, username } = contentRemote;

    return (
      <footer className={styles.footer}>
        <div className={styles.info}>
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
          &nbsp;•&nbsp;
          <a href={link} target="_blank" rel="noopener noreferrer">
            <F msg="permalink" />
          </a>
        </div>
        <div className={styles.actions}>
          <Favorite contentRemote={contentRemote} />
        </div>
      </footer>
    );
  }
}

export default Footer;
