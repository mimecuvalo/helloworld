import classNames from 'classnames';
import { contentUrl } from '../../shared/util/url_factory';
import { defineMessages, injectIntl } from '../../shared/i18n';
import { Link } from 'react-router-dom';
import React, { PureComponent } from 'react';
import styles from './ContentThumb.module.css';

const messages = defineMessages({
  thumbnail: { msg: 'thumbnail' },
});

@injectIntl
class Thumb extends PureComponent {
  constructor() {
    super();

    this.image = React.createRef();
  }

  render() {
    const item = this.props.item;
    const currentContent = this.props.currentContent || {};
    const thumbAltText = this.props.intl.formatMessage(messages.thumbnail);

    // We're using the fancy new "loading" attribute for images to lazy load thumbs. Woo!
    return (
      <Link
        to={contentUrl(item)}
        className={classNames(styles.thumbLink, this.props.className)}
        title={item.title}
        target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
      >
        <img
          loading="lazy"
          src={item.thumb || '/img/pixel.gif'}
          ref={this.image}
          alt={thumbAltText}
          className={styles.thumb}
        />
      </Link>
    );
  }
}

export default Thumb;
