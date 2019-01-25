import { contentUrl } from '../../shared/util/url_factory';
import { F } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './Nav.module.css';

@graphql(
  gql`
    query($username: String!, $section: String!, $album: String!, $name: String!) {
      fetchContentNeighbors(username: $username, section: $section, album: $album, name: $name) {
        first {
          username
          section
          album
          name
          title
        }
        last {
          username
          section
          album
          name
          title
        }
        next {
          username
          section
          album
          name
          title
        }
        prev {
          username
          section
          album
          name
          title
        }
        top {
          username
          section
          album
          name
          title
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
class Nav extends PureComponent {
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

    const contentNeighbors = this.props.data.fetchContentNeighbors;

    const first = contentNeighbors.first || {};
    const prev = contentNeighbors.prev || {};
    const top = contentNeighbors.top || {};
    const next = contentNeighbors.next || {};
    const last = contentNeighbors.last || {};

    return (
      <nav className={styles.nav}>
        <a rel="last" className="hw-last hw-button" href={contentUrl(last)} title={last.title}>
          <F msg="last" />
        </a>
        <a rel="next" className="hw-next hw-button" href={contentUrl(next)} title={next.title}>
          <F msg="next" />
        </a>
        <a rel="top" className="hw-top hw-button" href={contentUrl(top)} title={top.title}>
          {top.name}
        </a>
        <a rel="prev" className="hw-previous hw-button" href={contentUrl(prev)} title={prev.title}>
          <F msg="prev" />
        </a>
        <a rel="first" className="hw-first hw-button" href={contentUrl(first)} title={first.title}>
          <F msg="first" />
        </a>
      </nav>
    );
  }
}

export default Nav;
