import classNames from 'classnames';
import { contentUrl } from '../../shared/util/url_factory';
import { Link } from 'react-router-dom';
import React, { useContext } from 'react';
import styles from './ContentLink.module.css';
import UserContext from '../app/User_Context';

export default function ContentLink(props) {
  const user = useContext(UserContext).user;

  const item = props.item;
  const currentContent = props.currentContent || {};
  const isOwnerViewing = user?.model?.username === item.username;
  const { rel, innerRef, url } = props;

  return (
    <Link
      to={url || contentUrl(item)}
      title={item.title}
      className={classNames(props.className, {
        [styles.hidden]: isOwnerViewing && item.hidden,
      })}
      target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
      rel={rel}
      innerRef={innerRef}
    >
      {props.children}
    </Link>
  );
}
