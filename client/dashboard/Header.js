import classNames from 'classnames';
import { defineMessages, F, useIntl } from '../../shared/i18n';
import React from 'react';
import styles from './Header.module.css';

const messages = defineMessages({
  avatar: { msg: 'avatar' },
});

export default function Header({ contentRemote }) {
  const intl = useIntl();
  const { avatar, creator, link, read, title } = contentRemote;
  const avatarAltText = intl.formatMessage(messages.avatar);

  return (
    <>
      {title ? (
        <header className={styles.header}>
          <h1 className={classNames(styles.title, { [styles.isRead]: read })}>
            <a href={link} target="_blank" rel="noopener noreferrer">
              {title}
            </a>
          </h1>
        </header>
      ) : null}
      {creator ? (
        <div className={styles.creator}>
          <F msg={`by {creator}`} values={{ creator }} />
        </div>
      ) : null}
      {avatar ? <img src={avatar} className={styles.avatar} alt={avatarAltText} /> : null}
    </>
  );
}
