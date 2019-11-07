import classNames from 'classnames';
import { contentUrl } from '../../shared/util/url_factory';
import { Link } from 'react-router-dom';
import React, { PureComponent } from 'react';
import styles from './ContentLink.module.css';
import UserContext from '../app/User_Context';

export default class ContentLink extends PureComponent {
  static contextType = UserContext;

  render() {
    const item = this.props.item;
    const currentContent = this.props.currentContent || {};
    const isOwnerViewing = this.context.user?.model?.username === item.username;
    const { rel, innerRef, url } = this.props;

    return (
      <Link
        to={url || contentUrl(item)}
        title={item.title}
        className={classNames(this.props.className, {
          [styles.hidden]: isOwnerViewing && item.hidden,
        })}
        target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
        rel={rel}
        innerRef={innerRef}
      >
        {this.props.children}
      </Link>
    );
  }
}
