import classNames from 'classnames';
import { defineMessages, injectIntl } from '../../shared/i18n';
import React, { Component } from 'react';
import styles from './Thumb.module.css';

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
  }

  componentDidMount() {
    window.addEventListener('scroll', this.maybeLoadImage, { passive: true });
    window.addEventListener('resize', this.maybeLoadImage, { passive: true });

    this.maybeLoadImage();
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  removeEventListeners() {
    window.removeEventListener('scroll', this.maybeLoadImage);
    window.removeEventListener('resize', this.maybeLoadImage);
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
    const thumbAltText = this.props.intl.formatMessage(messages.thumbnail);
    const src = this.state.isAboveFold ? item.thumb : '/img/pixel.gif';

    return (
      <img
        src={src}
        ref={this.image}
        alt={thumbAltText}
        onLoad={this.handleThumbLoad}
        className={classNames('hw-invisible-slow-transition', styles.thumb, {
          'hw-invisible': !this.state.isLoaded || !this.state.isAboveFold,
        })}
      />
    );
  }
}

export default injectIntl(Thumb);
