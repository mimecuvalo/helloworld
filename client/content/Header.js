import ContentLink from 'client/components/ContentLink';
import { F } from 'shared/util/i18n';
import UserContext from 'client/app/User_Context';
import classNames from 'classnames';
import { createUseStyles } from 'react-jss';
import { useContext } from 'react';

const useStyles = createUseStyles({
  header: {
    marginBottom: '6px',
    padding: '6px 10px',
    position: 'sticky',
    top: 0,
    background: '#111',
    zIndex: 1,
  },
  title: {
    display: 'flex',
    margin: '3px 3px 3px 0',
    fontSize: '24px',
    fontWeight: '400',
  },
  titleLink: {
    flex: '1',
    color: '#fff',

    '&:visited': {
      color: '#fff',
    },
  },
  edit: {
    lineHeight: '14px',
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '2px',
    padding: '0 7px',
    color: '#060',
    alignSelf: 'flex-start',
  },
});

export default function Header({ content, handleEdit, isEditing }) {
  const user = useContext(UserContext).user;
  const isOwnerViewing = user?.model?.username === content.username;
  const styles = useStyles();

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        <ContentLink item={content} currentContent={content} className={styles.titleLink}>
          <span className="p-name">{content.title && <span className="notranslate">{content.title}</span>}</span>
          {isOwnerViewing && content.hidden && (
            <span>
              &nbsp;
              <F defaultMessage="(hidden)" />
            </span>
          )}
        </ContentLink>

        {isOwnerViewing ? (
          <button
            onClick={handleEdit}
            className={classNames('hw-button', 'hw-button-link', 'hw-edit', styles.edit, {
              'hw-selected': isEditing,
            })}
          >
            <F defaultMessage="edit" />
          </button>
        ) : null}
      </h1>
    </header>
  );
}
