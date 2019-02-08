import { contentUrl } from '../../shared/util/url_factory';
import { F } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { Link } from 'react-router-dom';
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
        }
        prev {
          ${NAV_FIELDS}
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
  }
)
class Nav extends Component {
  shouldComponentUpdate(nextProps) {
    return !nextProps.data.loading;
  }

  renderLink(contentMeta, name, msg) {
    contentMeta = contentMeta || {};

    const url = contentUrl(
      contentMeta,
      undefined /* host */,
      contentMeta.template === 'latest' ? { mode: 'archive' } : undefined
    );
    if (!url) {
      return (
        <a href={url} rel={name} className={`hw-${name} hw-button`} title={contentMeta.title}>
          {msg}
        </a>
      );
    }

    return (
      <Link
        to={url}
        rel={name}
        className={`hw-${name} hw-button`}
        title={contentMeta.title}
        target={contentMeta.forceRefresh || this.props.content.forceRefresh ? '_self' : ''}
      >
        {msg}
      </Link>
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
        {this.renderLink(top, 'top', top.name)}
        {this.renderLink(prev, 'prev', <F msg="prev" />)}
        {this.renderLink(first, 'first', <F msg="first" />)}
      </nav>
    );
  }
}

export default Nav;
