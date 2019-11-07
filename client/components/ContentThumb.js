import classNames from 'classnames';
import { contentUrl } from '../../shared/util/url_factory';
import { defineMessages, useIntl } from '../../shared/i18n';
import { Link } from 'react-router-dom';
import React, { useRef } from 'react';
import styles from './ContentThumb.module.css';

const messages = defineMessages({
  thumbnail: { msg: 'thumbnail' },
});

export default function Thumb({ className, item, currentContent, isEditing }) {
  const intl = useIntl();
  const image = useRef();

  currentContent = currentContent || {};
  const thumbAltText = intl.formatMessage(messages.thumbnail);

  const thumb = (
    <img loading="lazy" src={item.thumb || '/img/pixel.gif'} ref={image} alt={thumbAltText} className={styles.thumb} />
  );

  // We're using the fancy new "loading" attribute for images to lazy load thumbs. Woo!
  return !isEditing && item.externalLink ? (
    <a
      className={classNames(styles.thumbLink, className)}
      href={item.externalLink}
      target="_blank"
      rel="noreferrer noopener"
    >
      {thumb}
    </a>
  ) : (
    <Link
      to={contentUrl(item)}
      className={classNames(styles.thumbLink, className)}
      title={item.title}
      target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
    >
      {thumb}
    </Link>
  );
}
