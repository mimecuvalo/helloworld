import { Content, ContentMetaInfo } from 'data/graphql-generated';
import { Link, styled } from 'components';
import { Palette, PaletteColor, useTheme } from '@mui/material/styles';
import { gql, useQuery } from '@apollo/client';

import ContentLink from 'components/ContentLink';
import { F } from 'i18n';
import baseTheme from 'styles';
import { contentUrl } from 'util/url-factory';
import { MouseEvent, ReactNode, Ref, useEffect, useImperativeHandle, useRef } from 'react';
import { LinkProps } from '@mui/material';

const StyledNav = styled('nav')`
  position: relative;
  float: right;
  margin-left: ${(props) => props.theme.spacing(3.5)};
  white-space: nowrap;
  z-index: ${baseTheme.zindex.nav};

  a {
    display: inline-block;
    background-color: ${(props) => props.theme.palette.background.default};
    margin-right: ${(props) => props.theme.spacing(1)};
    margin-bottom: ${(props) => props.theme.spacing(2)};
    padding: ${(props) => props.theme.spacing(0, 1)};
  }

  ${(props) => props.theme.breakpoints.down('md')} {
    width: 75px;
    text-align: right;
    white-space: normal;
  }
`;

const LoadingEmptyBox = styled('div')`
  float: right;
  height: ${(props) => props.theme.spacing(4)};
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
  query FetchContentNeighbors($username: String!, $name: String!) {
    fetchContentNeighbors(username: $username, name: $name) {
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

export default function Nav({
  content,
  ref,
}: {
  content: Content;
  ref?: LinkProps['ref'] & Ref<{ prev: () => void; next: () => void }>;
}) {
  const { username, name } = content;
  const theme = useTheme();
  const { loading, data } = useQuery(FETCH_CONTENT_NEIGHBORS, {
    variables: {
      username,
      name,
    },
  });

  const next = useRef<HTMLAnchorElement>(null);
  const top = useRef<HTMLAnchorElement>(null);
  const prev = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  });

  useImperativeHandle(ref, () => ({
    prev: () => {
      prev?.current?.click();
    },
    next: () => {
      next?.current?.click();
    },
  }));

  const handleKeyUp = (evt: KeyboardEvent) => {
    switch (evt.key) {
      case 'ArrowUp':
        top?.current?.click();
        break;
      case 'ArrowLeft':
        next?.current?.click();
        break;
      case 'ArrowRight':
        prev?.current?.click();
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

  if (loading || !data || !data.fetchContentNeighbors) {
    return <LoadingEmptyBox />;
  }

  function renderLink(
    contentMeta: ContentMetaInfo,
    name: string,
    msg: ReactNode,
    colorPalette: keyof Palette,
    ref?: Ref<HTMLAnchorElement>
  ) {
    contentMeta = contentMeta || {};

    const linkCommonProperties = {
      rel: name,
      className: name === 'top' ? `hw-${name} notranslate` : `hw-${name}`,
      sx: {
        border: `1px solid ${(theme.palette[colorPalette] as PaletteColor).main}`,
        boxShadow: `1px 1px ${(theme.palette[colorPalette] as PaletteColor).main},
              2px 2px ${(theme.palette[colorPalette] as PaletteColor).main},
              3px 3px ${(theme.palette[colorPalette] as PaletteColor).main}`,
        '&:hover': {
          border: `1px solid ${(theme.palette[colorPalette] as PaletteColor).dark}`,
          boxShadow: `1px 1px ${(theme.palette[colorPalette] as PaletteColor).dark},
              2px 2px ${(theme.palette[colorPalette] as PaletteColor).dark},
              3px 3px ${(theme.palette[colorPalette] as PaletteColor).dark}`,
        },
      },
    };
    const url = contentUrl(
      contentMeta,
      false /* isAbsolute */,
      contentMeta.template === 'latest' ? { mode: 'archive' } : undefined
    );
    if (!url) {
      return (
        <Link
          href="#"
          onClick={(evt: MouseEvent) => evt.preventDefault()}
          title={contentMeta.title}
          {...linkCommonProperties}
          style={{ cursor: 'default' }}
        >
          {msg}
        </Link>
      );
    }

    // Preload surrounding content. We preload the GraphQL data here. Then, we also preload the images.
    if (['prev', 'next'].indexOf(name) !== -1) {
      // TODO disabled, save data for now.
      // client.query({
      //   query: ContentQuery,
      //   variables: { username: contentMeta.username, name: contentMeta.name },
      // });

      if (typeof window !== 'undefined') {
        for (const img of contentMeta.prefetchImages || []) {
          new Image().src = img;
        }
      }
    }

    return (
      <ContentLink ref={ref} url={url} item={contentMeta} currentContent={content} {...linkCommonProperties}>
        {msg}
      </ContentLink>
    );
  }

  return (
    <StyledNav>
      {renderLink(data.fetchContentNeighbors.last, 'last', <F defaultMessage="last" />, 'info')}
      {renderLink(data.fetchContentNeighbors.next, 'next', <F defaultMessage="next" />, 'warning', next)}
      {renderLink(data.fetchContentNeighbors.top, 'top', data.fetchContentNeighbors.top?.name, 'success', top)}
      {renderLink(data.fetchContentNeighbors.prev, 'prev', <F defaultMessage="prev" />, 'error', prev)}
      {renderLink(data.fetchContentNeighbors.first, 'first', <F defaultMessage="first" />, 'secondary')}
    </StyledNav>
  );
}
