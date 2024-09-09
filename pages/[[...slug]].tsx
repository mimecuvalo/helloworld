import { Comment, ContentAndUserQuery, Content as ContentType, Favorite, UserPublic } from 'data/graphql-generated';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { addApolloState, initializeApollo } from 'app/apollo';
import { buildUrl, contentUrl } from 'util/url-factory';
import { themeGlobalCss, themes } from 'styles/theme';
import { useEffect, useRef, useState } from 'react';

import ContentBase from 'components/content/ContentBase';
import ContentHead from 'components/content/ContentHead';
import ContentQuery from 'components/content/ContentQuery';
import Feed from 'components/content/Feed';
import { GetServerSideProps } from 'next';
import Item from 'components/content/Item';
import Nav from 'components/content/Nav';
import NotFound from 'pages/404';
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

  const router = useRouter();
  const contentBase = useRef<Element>(null);
  const nav = useRef<Element>(null);
  const swipeListener = useRef(null);
  const [currentCanonicalUrl, setCurrentCanonicalUrl] = useState('');

  useEffect(() => {
    if (loading || !data || !data.fetchContent) {
      return;
    }

    const canonicalUrl = contentUrl(data.fetchContent);
    if (currentCanonicalUrl !== canonicalUrl) {
      const absoluteCanonicalUrl = buildUrl({ isAbsolute: true, pathname: canonicalUrl });
      const parsedCanonicalUrl = new URL(absoluteCanonicalUrl);
      const currentWindowUrl = new URL(window.location.href);

      if (currentWindowUrl.pathname !== parsedCanonicalUrl.pathname) {
        router.replace(canonicalUrl);
      }
      setCurrentCanonicalUrl(canonicalUrl);
    }

    // Only swipe on photos section.
    if (data.fetchContent.section === 'photos' && data.fetchContent.album !== 'main') {
      setupSwipe();
    }

    return () => {
      // @ts-ignore this is fine.
      swipeListener?.current && swipeListener.current.off();
      swipeListener.current = null;
    };
  }, [loading, data, router, currentCanonicalUrl]);

  function setupSwipe() {
    if (swipeListener.current || !contentBase.current) {
      return;
    }

    swipeListener.current = SwipeListener(contentBase.current);
    // eslint-disable-next-line
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

export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
  const host = req.headers['host'] || '';
  const client = initializeApollo(null /* initialState */, { 'x-hw-host': host });
  const slug = (params?.slug as string[]) || [];
  const path = '/' + slug.join('/');
  const username = slug[0] || '';
  const name = slug.length > 1 ? slug.slice(-1)[0] : '';

  // so much spam
  if (name.includes('.') || username === 'login' || username.includes('.') || path === '/api/v1/instance') {
    return {
      notFound: true,
    };
  }

  /** Paths can look like:
    /:username/search/:query
    /:username/:section/:album/:name
    /:username/:section/:name
    /:username/:name
    /:username
    /
  */

  try {
    await client.query({
      query: ContentQuery,
      variables: {
        username: username,
        name: username ? name || 'home' : '',
      },
    });
  } catch (ex) {
    return {
      props: { username, name },
    };
  }

  // XXX: staunch bleeding for now for supabase overuse. one month caching.
  const oneMonth = 60 * 60 * 24 * 30;
  res.setHeader('Cache-Control', `public, s-maxage=${oneMonth}`);
  // res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=3600');

  return addApolloState(client, {
    props: { username, name, host },
  });
};
