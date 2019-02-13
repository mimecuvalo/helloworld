import { defineMessages, F, injectIntl } from '../../shared/i18n';
import React, { PureComponent } from 'react';
import styles from './Header.module.css';

const messages = defineMessages({
  avatar: { msg: 'avatar' },
});

class Header extends PureComponent {
  render() {
    const { avatar, creator, link, title } = this.props.contentRemote;
    const avatarAltText = this.props.intl.formatMessage(messages.avatar);

    return (
      <>
        {title ? (
          <header className={styles.header}>
            <h1 className={styles.title}>
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
}

export default injectIntl(Header);
