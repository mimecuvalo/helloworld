import { Comment, ContentAndUserQuery, Content as ContentType, Favorite, UserPublic } from 'data/graphql-generated';
import { addApolloState, initializeApollo } from 'app/apollo';
import { buildUrl, contentUrl } from 'util/url-factory';
import { memo, useEffect, useRef, useState } from 'react';

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
import { styled } from 'components';
import { transientOptions } from 'util/css';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

const StyledContent = styled('article', transientOptions)<{ $isFeedWrapper: boolean }>`
  margin: ${(props) => props.theme.spacing(1)};
  padding: 0 3px 10px 3px;

  @media only screen and (max-width: 600px) {
    & {
      width: auto !important;
    }
  }

  ${(props) =>
    props.$isFeedWrapper
      ? `
    display: flex;
    flex-direction: row;
    flex-flow: wrap;
    align-items: flex-start;
    width: 100%;
  `
      : `
    width: 75vw;
  `}
`;

export default function Content({ username, name }: { username: string; name: string }) {
  const { loading, data } = useQuery<ContentAndUserQuery>(ContentQuery, {
    variables: {
      username: username || '',
      name: username ? name || 'home' : '',
    },
  });

  return <PersistedContent loading={loading} data={data} />;
}

// TODO: remove?
// This is separate and memoized so that we don't re-render while loading.
// Otherwise, it's a bit jarring when the content structure disappears everytime you click next/prev.
const PersistedContent = memo(
  function PersistedContent({ loading, data }: { loading: boolean; data: ContentAndUserQuery | undefined }) {
    const router = useRouter();
    const contentBase = useRef<Element>(null);
    //const nav = useRef<Element>(null);
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

      setupSwipe();
      return () => {
        // @ts-ignore this is fine.
        swipeListener?.current && swipeListener.current.off();
        swipeListener.current = null;
      };
    }, [loading, data, router, currentCanonicalUrl]);

    // useEffect(() => {
    //   document.addEventListener('keydown', handleKeyDown);

    //   return () => {
    //     document.removeEventListener('keydown', handleKeyDown);
    //   };
    // });

    function setupSwipe() {
      if (swipeListener.current || !contentBase.current) {
        return;
      }

      swipeListener.current = SwipeListener(contentBase.current);
      // eslint-disable-next-line
      contentBase.current.addEventListener('swipe', (e: any) => {
        //const directions = e.detail.directions;
        // TODO fix
        // if (directions.left) {
        //   nav.current && nav.current.prev();
        // } else if (directions.right) {
        //   nav.current && nav.current.next();
        // }
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
        <>
          <ContentHead content={content} contentOwner={contentOwner} title={title} username={content.username} />
          <div id="hw-content">
            <Simple content={content} />
          </div>
        </>
      );
    }

    const itemEl =
      content.template === 'feed' ? (
        <Feed content={content} />
      ) : (
        <Item content={content} contentOwner={contentOwner} comments={comments} favorites={favorites} />
      );

    return (
      <ContentBase content={content} contentOwner={contentOwner} title={title} username={content.username}>
        <StyledContent $isFeedWrapper={content.template === 'feed'}>
          <Nav content={content} />
          {itemEl}
        </StyledContent>
      </ContentBase>
    );
  },
  (prevProps, nextProps) => {
    return nextProps.loading;
  }
);

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const client = initializeApollo();
  const slug = (params?.slug as string[]) || [];
  const username = slug[0] || '';
  const name = slug.length > 1 ? slug.slice(-1)[0] : '';

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

  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=3600');

  return addApolloState(client, {
    props: { username, name },
  });
};
