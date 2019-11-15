import { createUseStyles } from 'react-jss';
import { F, FormattedDate } from '../../shared/i18n';
import Favorite from './actions/Favorite';
import KeepUnread from './actions/KeepUnread';
import React from 'react';
import Reblog from './actions/Reblog';
import Reply from './actions/Reply';

const useStyles = createUseStyles({
  footer: {
    position: 'sticky',
    bottom: '0',
    display: 'flex',
    fontSize: '11px',
    boxShadow: '0px -1px 0 #0bf, 0 -9px 0 #fafafa',
    padding: '3px 6px 5px 3px',
    marginTop: '12px',
    background: '#fafafa',
  },
  permalink: {
    color: 'inherit',
  },
  info: {
    flex: '1',
    marginRight: '32px',
  },
  actions: {
    textAlign: 'right',
  },
});

export default function Footer({ contentRemote, getEditor, keepUnreadCb }) {
  const { createdAt, link, updatedAt, username } = contentRemote;
  const styles = useStyles();

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
          {updatedAt && updatedAt !== createdAt && (
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
        <Reblog contentRemote={contentRemote} getEditor={getEditor} />
        &nbsp;•&nbsp;
        <Favorite contentRemote={contentRemote} isDashboard={true} />
        &nbsp;•&nbsp;
        <KeepUnread keepUnreadCb={keepUnreadCb} contentRemote={contentRemote} />
        &nbsp;•&nbsp;
        <Reply contentRemote={contentRemote} getEditor={getEditor} />
      </div>
    </footer>
  );
}
