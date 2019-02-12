import { defineMessages, F, injectIntl } from '../../shared/i18n';
import React, { PureComponent } from 'react';
import styles from './Header.module.css';

const messages = defineMessages({
  avatar: { msg: 'avatar' },
});

class Header extends PureComponent {
  render() {
    const { avatar, creator, title } = this.props.contentRemote;
    const avatarAltText = this.props.intl.formatMessage(messages.avatar);

    return (
      <>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
        </header>
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
