import { ApolloClient, gql, useQuery } from '@apollo/client';
import { ReactNode, forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';

import ContentLink from 'components/ContentLink';
import ContentQuery from './ContentQuery';
import { F } from 'i18n';
import { contentUrl } from 'util/url-factory';
import { styled } from 'components';

const StyledNav = styled('nav')`
  float: right;
  padding: 4px 0;
  white-space: nowrap;
`;

const LoadingEmptyBox = styled('div')`
  float: right;
  height: 32px;
`;

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

export default function Nav({ content, isEditing }: { content: Content; isEditing: boolean }) {
  const { username, section, album, name } = content;
  const { loading, data, client } = useQuery(FETCH_CONTENT_NEIGHBORS, {
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
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  });

  // TODO
  // useImperativeHandle(ref, () => ({
  //   prev: () => {
  //     prev?.current && prev.current.click();
  //   },
  //   next: () => {
  //     next?.current && next.current.click();
  //   },
  // }));

  const handleKeyUp = (evt) => {
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

  if (
    content.template === 'feed' ||
    content.section === 'main' ||
    content.album === 'main' ||
    content.name === 'main'
  ) {
    return null;
  }

  return (
    <PersistedNav
      loading={loading}
      navigationActions={navigationActions}
      client={client}
      content={content}
      data={data}
    />
  );
}

// This is separate and memoized so that we don't re-render while loading.
// Otherwise, it's a bit jarring when the navigation menu disappears everytime you click next/prev.
const PersistedNav = memo(
  function PersistedNav({
    loading,
    navigationActions,
    client,
    content,
    data,
  }: {
    loading: boolean;
    navigationActions: { [key: string]: ReactNode };
    client: ApolloClient;
    content: Content;
    data: any;
  }) {
    if (loading) {
      return <LoadingEmptyBox />;
    }

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
            className={classNames(`hw-${name} hw-button`, { notranslate: name === 'top' })}
            title={contentMeta.title}
          >
            {msg}
          </a>
        );
      }

      // Preload surrounding content. We preload the GraphQL data here. Then, we also preload the images.
      if (['prev', 'next'].indexOf(name) !== -1) {
        client.query({
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
          url={url}
          item={contentMeta}
          currentContent={content}
          rel={name}
          innerRef={navigationActions[name]}
          className={classNames(`hw-${name} hw-button`, { notranslate: name === 'top' })}
        >
          {msg}
        </ContentLink>
      );
    }

    return (
      <StyledNav>
        {renderLink(data.fetchContentNeighbors.last, 'last', <F defaultMessage="last" />)}
        {renderLink(data.fetchContentNeighbors.next, 'next', <F defaultMessage="next" />)}
        {renderLink(data.fetchContentNeighbors.top, 'top', data.fetchContentNeighbors.top?.name)}
        {renderLink(data.fetchContentNeighbors.prev, 'prev', <F defaultMessage="prev" />)}
        {renderLink(data.fetchContentNeighbors.first, 'first', <F defaultMessage="first" />)}
      </StyledNav>
    );
  },
  (prevProps, nextProps) => {
    return nextProps.loading;
  }
);
