import _ from 'lodash';
import classNames from 'classnames';
import { contentUrl } from '../../shared/util/url_factory';
import { defineMessages, injectIntl } from '../../shared/i18n';
import { Link } from 'react-router-dom';
import React, { Component } from 'react';
import styles from './ContentThumb.module.css';

const messages = defineMessages({
  thumbnail: { msg: 'thumbnail' },
});

class Thumb extends Component {
  constructor() {
    super();

    this.image = React.createRef();

    this.state = {
      isAboveFold: false,
      isLoaded: false,
    };

    this.throttledMaybeLoadImage = _.throttle(this.maybeLoadImage, 100);
  }

  componentDidMount() {
    window.addEventListener('scroll', this.throttledMaybeLoadImage, { passive: true });
    window.addEventListener('resize', this.throttledMaybeLoadImage, { passive: true });

    this.maybeLoadImage();
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  removeEventListeners() {
    window.removeEventListener('scroll', this.throttledMaybeLoadImage);
    window.removeEventListener('resize', this.throttledMaybeLoadImage);
  }

  maybeLoadImage = () => {
    if (this.image.current.getBoundingClientRect().top < window.innerHeight + 175 /* fudge factor */) {
      this.setState({ isAboveFold: true });
      this.removeEventListeners();
    }
  };

  handleThumbLoad = evt => {
    if (!this.state.aboveFold) {
      this.setState({ isLoaded: true });
    }
  };

  render() {
    const item = this.props.item;
    const currentContent = this.props.currentContent || {};
    const thumbAltText = this.props.intl.formatMessage(messages.thumbnail);
    const src = this.state.isAboveFold ? item.thumb : '/img/pixel.gif';

    return (
      <Link
        to={contentUrl(item)}
        className={classNames(styles.thumbLink, this.props.className)}
        title={item.title}
        target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
      >
        <img
          src={src}
          ref={this.image}
          alt={thumbAltText}
          onLoad={this.handleThumbLoad}
          className={classNames('hw-invisible-slow-transition', styles.thumb, {
            'hw-invisible': !this.state.isLoaded || !this.state.isAboveFold,
          })}
        />
      </Link>
    );
  }
}

export default injectIntl(Thumb);
