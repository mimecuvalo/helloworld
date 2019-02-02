import classNames from 'classnames';
import { contentUrl } from '../../../shared/util/url_factory';
import { defineMessages, injectIntl } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { Link } from 'react-router-dom';
import React, { Component, PureComponent } from 'react';
import styles from './Album.module.css';
import UserContext from '../../app/User_Context';

const messages = defineMessages({
  thumbnail: { msg: 'thumbnail' },
});

@graphql(
  gql`
    query($username: String!, $section: String!, $name: String!) {
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
  `,
  {
    options: ({ content: { username, section, name } }) => ({
      variables: {
        username,
        section,
        name,
      },
    }),
  }
)
class Album extends PureComponent {
  static contextType = UserContext;

  render() {
    if (this.props.data.loading) {
      return <div className={styles.loadingEmptyBox} />;
    }

    const content = this.props.content;
    const isOwnerViewing = this.context.user?.model?.username === content.username;
    const collection = this.props.data.fetchCollection;

    return (
      <ul className={styles.album}>
        {collection.map(item => (
          <li key={item.name} className={styles.item}>
            <Link to={contentUrl(item)} className={styles.thumbLink} title={item.title}>
              <DelayLoadedThumb item={item} />
            </Link>
            <Link
              to={contentUrl(item)}
              title={item.title}
              className={classNames('hw-album-title', styles.title, styles.link, {
                [styles.hidden]: isOwnerViewing && item.hidden,
              })}
            >
              {item.title}
            </Link>
          </li>
        ))}
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
const DelayLoadedThumb = injectIntl(Thumb);

export default Album;
