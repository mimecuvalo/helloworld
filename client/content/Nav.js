import { ApolloConsumer } from '@apollo/react-hooks';
import ContentLink from '../components/ContentLink';
import ContentQuery from './ContentQuery';
import { contentUrl } from '../../shared/util/url_factory';
import { F } from '../../shared/i18n';
import gql from 'graphql-tag';
import React, { useEffect, useImperativeHandle, useRef } from 'react';
import styles from './Nav.module.css';
import { useQuery } from '@apollo/react-hooks';

const NAV_FIELDS = `
  album
  forceRefresh
  hidden
  name
  section
  title
  username
`;

const FETCH_CONTENT_NEIGHBORS = gql`
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
  `;

function Nav({ apolloClient, content, isEditing }) {
  const { username, section, album, name } = content;
  const { loading, data } = useQuery(FETCH_CONTENT_NEIGHBORS, {
    variables: {
      username,
      section,
      album,
      name,
    },
  });

  const last = useRef(null);
  const next = useRef(null);
  const top = useRef(null);
  const prev = useRef(null);
  const first = useRef(null);
  const navigationActions = { last, next, top, prev, first };

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp.bind(this));
    return () => window.removeEventListener('keyup', handleKeyUp);
  });

  useImperativeHandle(prev, () => ({
    goPrev: () => {
      prev?.current && prev.current.click();
    },
  }));
  useImperativeHandle(next, () => ({
    goNext: () => {
      next?.current && next.current.click();
    },
  }));

  const handleKeyUp = evt => {
    if (isEditing) {
      return;
    }

    switch (evt.key) {
      case 'ArrowUp':
        top?.current && top.current.click();
        break;
      case 'ArrowLeft':
        next?.current && next.current.click();
        break;
      case 'ArrowRight':
        prev?.current && prev.current.click();
        break;
      default:
        break;
    }
  };

  function renderLink(contentMeta, name, msg) {
    contentMeta = contentMeta || {};

    const url = contentUrl(
      contentMeta,
      false /* isAbsolute */,
      contentMeta.template === 'latest' ? { mode: 'archive' } : undefined
    );
    if (!url) {
      return (
        <a
          href={url}
          rel={name}
          ref={navigationActions[name]}
          className={`hw-${name} hw-button`}
          title={contentMeta.title}
        >
          {msg}
        </a>
      );
    }

    // Preload surrounding content. We preload the GraphQL data here. Then, we also preload the images.
    if (['prev', 'next'].indexOf(name) !== -1) {
      apolloClient.query({
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
        currentContent={content}
        rel={name}
        innerRef={navigationActions[name]}
        className={`hw-${name} hw-button`}
      >
        {msg}
      </ContentLink>
    );
  }

  if (
    content.template === 'feed' ||
    content.section === 'main' ||
    content.album === 'main' ||
    content.name === 'main'
  ) {
    return null;
  }

  if (loading) {
    return <div className={styles.loadingEmptyBox} />;
  }

  return (
    <nav className={styles.nav}>
      {renderLink(data.fetchContentNeighbors.last, 'last', <F msg="last" />)}
      {renderLink(data.fetchContentNeighbors.next, 'next', <F msg="next" />)}
      {renderLink(data.fetchContentNeighbors.top, 'top', top?.name)}
      {renderLink(data.fetchContentNeighbors.prev, 'prev', <F msg="prev" />)}
      {renderLink(data.fetchContentNeighbors.first, 'first', <F msg="first" />)}
    </nav>
  );
}

export default function NavWithApolloClient(props) {
  const nav = useRef(null);

  useImperativeHandle(nav, () => ({
    prev: () => {
      nav.current && nav.current.getWrappedInstance().goPrev();
    },
    next: () => {
      nav.current && nav.current.getWrappedInstance().goNext();
    },
  }));

  return <ApolloConsumer>{apolloClient => <Nav ref={nav} apolloClient={apolloClient} {...props} />}</ApolloConsumer>;
}
