'use client';

import { Comment, ContentAndUserQuery, Content as ContentType, Favorite, UserPublic } from 'data/graphql-generated';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { buildUrl, contentUrl } from 'util/url-factory';
import { themeGlobalCss, themes } from 'styles/theme';
import { useEffect, useRef, useState } from 'react';

import ContentBase from 'components/content/ContentBase';
import ContentHead from 'components/content/ContentHead';
import ContentQuery from 'components/content/ContentQuery';
import Feed from 'components/content/Feed';
import Item from 'components/content/Item';
import Nav from 'components/content/Nav';
import NotFound from '../not-found';
import Simple from 'components/content/templates/Simple';
import SwipeListener from 'swipe-listener';
import { ThemeProvider } from '@mui/material/styles';
import { styled } from 'components';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

const StyledContent = styled('article', { label: 'StyledContent' })`
  margin-top: ${(props) => props.theme.spacing(1)};
  padding: ${(props) => props.theme.spacing(0, 0.5, 1, 0)};
  width: 75vw;

  ${(props) => props.theme.breakpoints.down('md')} {
    width: 100%;
  }
`;

export default function Content({ username, name, host }: { username: string; name: string; host: string }) {
  const { loading, data } = useQuery<ContentAndUserQuery>(ContentQuery, {
    variables: {
      username: username || '',
      name: username ? name || 'home' : '',
    },
  });

  // const router = useRouter();
  const contentBase = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLAnchorElement & { prev: () => void; next: () => void }>(null);
  const swipeListener = useRef(null);
  const [currentCanonicalUrl, setCurrentCanonicalUrl] = useState('');

  useEffect(() => {
    if (loading || !data || !data.fetchContent) {
      return;
    }

    // const canonicalUrl = contentUrl(data.fetchContent);
    // if (currentCanonicalUrl !== canonicalUrl) {
    //   const absoluteCanonicalUrl = buildUrl({ isAbsolute: true, pathname: canonicalUrl });
    //   const parsedCanonicalUrl = new URL(absoluteCanonicalUrl);
    //   const currentWindowUrl = new URL(window.location.href);

    //   if (currentWindowUrl.pathname !== parsedCanonicalUrl.pathname) {
    //     router.replace(canonicalUrl);
    //   }
    //   setCurrentCanonicalUrl(canonicalUrl);
    // }

    // Only swipe on photos section.
    if (data.fetchContent.section === 'photos' && data.fetchContent.album !== 'main') {
      setupSwipe();
    }

    return () => {
      if (swipeListener.current) {
        // @ts-ignore this is fine.
        swipeListener.current.off();
      }
      swipeListener.current = null;
    };
  }, [loading, data, router, currentCanonicalUrl]);

  function setupSwipe() {
    if (swipeListener.current || !contentBase.current) {
      return;
    }

    swipeListener.current = SwipeListener(contentBase.current);
    contentBase.current.addEventListener('swipe', (e: any) => {
      const directions = e.detail.directions;
      if (directions.left) {
        // @ts-ignore don't worry about it for now, we're using imperative handler.
        nav.current?.prev();
      } else if (directions.right) {
        // @ts-ignore don't worry about it for now, we're using imperative handler.
        nav.current?.next();
      }
    });
  }

  if (loading || !data) {
    return null;
  }

  const content = data.fetchContent as ContentType;

  if (!content) {
    return <NotFound />;
  }

  const contentOwner = data.fetchPublicUserData as UserPublic;
  const comments = data.fetchCommentsRemote as Comment[];
  const favorites = data.fetchFavoritesRemote as Favorite[];
  const title = (content.title ? content.title + ' – ' : '') + contentOwner.title;

  if (content.template === 'blank') {
    return (
      <ThemeProvider theme={themes[contentOwner.theme as keyof typeof themes]}>
        <CssBaseline />
        <GlobalStyles styles={() => themeGlobalCss[contentOwner.theme as keyof typeof themes]} />
        <ContentHead
          host={host}
          content={content}
          contentOwner={contentOwner}
          title={title}
          username={content.username}
        />
        <main id="hw-content">
          <Simple content={content} />
        </main>
      </ThemeProvider>
    );
  }

  const itemEl =
    content.template === 'feed' ? (
      <Feed content={content} />
    ) : (
      <Item ref={contentBase} content={content} contentOwner={contentOwner} comments={comments} favorites={favorites} />
    );

  return (
    <ContentBase content={content} contentOwner={contentOwner} title={title} username={content.username} host={host}>
      <StyledContent>
        <Nav ref={nav} content={content} />
        {itemEl}
      </StyledContent>
    </ContentBase>
  );
}
