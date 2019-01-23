import classNames from 'classnames';
import { contentUrl } from '../../shared/util/url_factory';
import { F } from '../../shared/i18n';
import React, { PureComponent } from 'react';
import styles from './Header.module.css';
import UserContext from '../app/User_Context';

class Header extends PureComponent {
  static contextType = UserContext;

  render() {
    const content = this.props.content;
    const isOwnerViewing = this.context.user && this.context.user.model.username === content.username;

    return (
      <header className={classNames(styles.header)}>
        <h1 className={styles.title}>
          <a href={contentUrl(content)}
              className={classNames({
                [styles.hidden]: isOwnerViewing && content.hidden
              })}>
            {content.title || <F msg="(untitled)" />}
            {isOwnerViewing && content.hidden && <F msg="(hidden)" />}
          </a>
        </h1>
      </header>
    );
  }
}

export default Header;