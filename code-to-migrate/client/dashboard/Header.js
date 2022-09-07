import { F, defineMessages, useIntl } from 'shared/util/i18n';

import classNames from 'classnames';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  header: {
    position: 'sticky',
    top: '0',
    background: '#fafafa',
    marginBottom: '7px',
    padding: ['0 6px', '0 6px'],
    width: 'calc(100% - 4px)',
    boxShadow: '0 -6px #fafafa, 1px 1px 0 #fa0, 2px 2px 0 #fa0, 3px 3px 0 #fa0, 0 0 0 8px #fafafa !important',
  },
  title: {
    margin: '3px 3px 3px 0',
  },
  creator: {
    marginBottom: '10px',
    fontSize: '12px',
    color: '#666',
  },
  avatar: {
    float: 'left',
    maxHeight: '32px',
    maxWidth: '32px',
    marginRight: '5px',
  },
  isRead: {
    fontWeight: '500',
  },
});

const messages = defineMessages({
  avatar: { defaultMessage: 'avatar' },
});

export default function Header({ contentRemote }) {
  const intl = useIntl();
  const { avatar, creator, link, read, title } = contentRemote;
  const avatarAltText = intl.formatMessage(messages.avatar);
  const styles = useStyles();

  return (
    <>
      {title ? (
        <header className={styles.header}>
          <h1 className={classNames(styles.title, { [styles.isRead]: read }, 'notranslate')}>
            <a href={link} target="_blank" rel="noopener noreferrer">
              {title}
            </a>
          </h1>
        </header>
      ) : null}
      {creator ? (
        <div className={styles.creator}>
          <F defaultMessage="by {creator}" values={{ creator }} />
        </div>
      ) : null}
      {avatar ? <img src={avatar} className={styles.avatar} alt={avatarAltText} /> : null}
    </>
  );
}
