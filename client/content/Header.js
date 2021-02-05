import classNames from 'classnames';
import ContentLink from '../components/ContentLink';
import { createUseStyles } from 'react-jss';
import { F } from 'react-intl-wrapper';
import React, { useContext } from 'react';
import UserContext from '../app/User_Context';

const useStyles = createUseStyles({
  header: {
    marginBottom: '6px',
    padding: '0 6px',
    width: '290px',
  },
  title: {
    display: 'flex',
    margin: '3px 3px 3px 0',
  },
  titleLink: {
    flex: '1',
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
          <span className="p-name">{content.title || <F msg="(untitled)" />}</span>
          {isOwnerViewing && content.hidden && (
            <span>
              &nbsp;
              <F msg="(hidden)" />
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
            <F msg="edit" />
          </button>
        ) : null}
      </h1>
    </header>
  );
}
