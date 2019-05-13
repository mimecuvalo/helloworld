import { ApolloConsumer } from 'react-apollo';
import ContentLink from '../components/ContentLink';
import ContentQuery from './ContentQuery';
import { contentUrl } from '../../shared/util/url_factory';
import { F } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { Component } from 'react';
import styles from './Nav.module.css';

const NAV_FIELDS = `
  album
  forceRefresh
  hidden
  name
  section
  title
  username
`;

@graphql(
  gql`
    query($username: String!, $section: String!, $album: String!, $name: String!) {
      fetchContentNeighbors(username: $username, section: $section, album: $album, name: $name) {
        first {
          ${NAV_FIELDS}
        }
        last {
          ${NAV_FIELDS}
        }
        next {
          ${NAV_FIELDS}
          prefetchImages
        }
        prev {
          ${NAV_FIELDS}
          prefetchImages
        }
        top {
          ${NAV_FIELDS}
          template
        }
      }
    }
  `,
  {
    options: ({ content: { username, section, album, name } }) => ({
      variables: {
        username,
        section,
        album,
        name,
      },
    }),
    withRef: true,
  }
)
class Nav extends Component {
  constructor(props) {
    super(props);

    this.last = React.createRef();
    this.next = React.createRef();
    this.top = React.createRef();
    this.prev = React.createRef();
    this.first = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  handleKeyUp = evt => {
    if (this.props.isEditing) {
      return;
    }

    switch (evt.key) {
      case 'ArrowUp':
        this.top?.current && this.top.current.click();
        break;
      case 'ArrowLeft':
        this.next?.current && this.next.current.click();
        break;
      case 'ArrowRight':
        this.prev?.current && this.prev.current.click();
        break;
      default:
        break;
    }
  };

  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  shouldComponentUpdate(nextProps) {
    return !nextProps.data.loading;
  }

  goPrev() {
    this.prev?.current && this.prev.current.click();
  }

  goNext() {
    this.next?.current && this.next.current.click();
  }

  renderLink(contentMeta, name, msg) {
    contentMeta = contentMeta || {};

    const url = contentUrl(
      contentMeta,
      false /* isAbsolute */,
      contentMeta.template === 'latest' ? { mode: 'archive' } : undefined
    );
    if (!url) {
      return (
        <a href={url} rel={name} ref={this[name]} className={`hw-${name} hw-button`} title={contentMeta.title}>
          {msg}
        </a>
      );
    }

    // Preload surrounding content. We preload the GraphQL data here. Then, we also preload the images.
    if (['prev', 'next'].indexOf(name) !== -1) {
      this.props.client.query({
        query: ContentQuery,
        variables: { username: contentMeta.username, name: contentMeta.name },
      });

      if (typeof window !== 'undefined') {
        for (const img of contentMeta.prefetchImages) {
          new Image().src = img;
        }
      }
    }

    return (
      <ContentLink
        item={contentMeta}
        currentContent={this.props.content}
        rel={name}
        innerRef={this[name]}
        className={`hw-${name} hw-button`}
      >
        {msg}
      </ContentLink>
    );
  }

  render() {
    const content = this.props.content;
    if (
      content.template === 'feed' ||
      content.section === 'main' ||
      content.album === 'main' ||
      content.name === 'main'
    ) {
      return null;
    }

    if (this.props.data.loading) {
      return <div className={styles.loadingEmptyBox} />;
    }

    const { first, prev, top, next, last } = this.props.data.fetchContentNeighbors;
    return (
      <nav className={styles.nav}>
        {this.renderLink(last, 'last', <F msg="last" />)}
        {this.renderLink(next, 'next', <F msg="next" />)}
        {this.renderLink(top, 'top', top?.name)}
        {this.renderLink(prev, 'prev', <F msg="prev" />)}
        {this.renderLink(first, 'first', <F msg="first" />)}
      </nav>
    );
  }
}

export default class NavWithApolloClient extends Component {
  constructor(props) {
    super(props);

    this.nav = React.createRef();
  }

  prev() {
    this.nav.current && this.nav.current.getWrappedInstance().goPrev();
  }

  next() {
    console.log(this.nav.current.getWrappedInstance());
    this.nav.current && this.nav.current.getWrappedInstance().goNext();
  }

  render() {
    return <ApolloConsumer>{client => <Nav ref={this.nav} client={client} {...this.props} />}</ApolloConsumer>;
  }
}
