import ContentLink from '../components/ContentLink';
import { F } from '../../shared/i18n';
import React, { PureComponent } from 'react';
import styles from './Header.module.css';
import UserContext from '../app/User_Context';

class Header extends PureComponent {
  static contextType = UserContext;

  render() {
    const content = this.props.content;
    const isOwnerViewing = this.context.user?.model?.username === content.username;

    return (
      <header className={styles.header}>
        <h1 className={styles.title}>
          <ContentLink item={content} currentContent={content}>
            {content.title || <F msg="(untitled)" />}
            &nbsp;
            {isOwnerViewing && content.hidden && <F msg="(hidden)" />}
          </ContentLink>

          {isOwnerViewing ? (
            <span>
              (
              <a href="#edit" onClick={this.props.handleEdit}>
                <F msg="edit" />
              </a>
              )
            </span>
          ) : null}
        </h1>
      </header>
    );
  }
}

export default Header;
