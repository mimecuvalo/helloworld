import classNames from 'classnames';
import ContentLink from '../components/ContentLink';
import { F } from '../../shared/i18n';
import React, { useContext } from 'react';
import styles from './Header.module.css';
import UserContext from '../app/User_Context';

export default function Header({ content, handleEdit, isEditing }) {
  const user = useContext(UserContext).user;
  const isOwnerViewing = user?.model?.username === content.username;

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
