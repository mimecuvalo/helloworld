import classNames from 'classnames';
import { contentUrl } from '../../../shared/util/url_factory';
import { defineMessages, injectIntl } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { Component, PureComponent } from 'react';
import styles from './Album.module.css';
import UserContext from '../../app/User_Context';

const messages = defineMessages({
  thumbnail: { msg: 'thumbnail' },
});

@graphql(gql`
  query ($username: String!, $section: String!, $name: String!) {
    fetchCollection(username: $username, section: $section, name: $name) {
      album
      hidden
      name
      section
      thumb
      title
      username
    }
  }
`, {
  options: ({ content: { username, section, name } }) => ({
    variables: {
      username,
      section,
      name,
    }
  })
})
class Album extends PureComponent {
  static contextType = UserContext;

  render() {
    const content = this.props.content;
    const isOwnerViewing = this.context.user && this.context.user.model.username === content.username;
    const collection = this.props.data.fetchCollection;

    return (
      <ul className={styles.album}>
        {collection.map(item =>
          <li key={item.name} className={styles.item}>
            <a href={contentUrl(item)} className={styles.thumbLink} title={item.title}>
              <DelayLoadedThumb item={item} />
            </a>
            <a href={contentUrl(item)} title={item.title}
                className={classNames(styles.title, styles.link, { [styles.hidden]: isOwnerViewing && item.hidden })}>
              {item.title}
            </a>
          </li>
        )}
      </ul>
    );
  }
}

class Thumb extends Component {
  constructor() {
    super();

    this.image = React.createRef();

    this.state = {
      isAboveFold: false,
      isLoaded: false
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
    }
  };

  handleThumbLoad = (evt) => {
    if (!this.state.aboveFold) {
      this.setState({ isLoaded: true });
      this.removeEventListeners();
    }
  }

  render() {
    const item = this.props.item;
    const thumbAltText = this.props.intl.formatMessage(messages.thumbnail);
    const src = this.state.isAboveFold ? item.thumb : '/img/pixel.gif';

    return (
      <img src={src}
          ref={this.image}
          alt={thumbAltText}
          onLoad={this.handleThumbLoad}
          className={classNames('hw-invisible-slow-transition', styles.thumb, {
            'hw-invisible': !this.state.isLoaded
          })} />
    );
  }
}
const DelayLoadedThumb = injectIntl(Thumb);

export default Album;
