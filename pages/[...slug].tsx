import { buildUrl, contentUrl } from 'util/url-factory';
import { memo, useEffect, useRef, useState } from 'react';

import ContentBase from 'components/content/ContentBase';
import ContentQuery from 'components/content/ContentQuery';
import Feed from 'components/content/Feed';
import Item from 'components/content/Item';
import Nav from 'components/content/Nav';
import NotFound from './404';
import Simple from 'components/content/templates/Simple';
import SwipeListener from 'swipe-listener';
import { styled } from 'components';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

const StyledContent = styled('article')<{ $isFeedWrapper: boolean }>`
  margin: var(--app-margin);
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

export default function Content({ username, name }) {
  const { loading, data } = useQuery(ContentQuery, {
    variables: {
      username: username || '',
      name: username ? name || 'home' : '',
    },
  });

  return <PersistedContent loading={loading} data={data} />;
}

// This is separate and memoized so that we don't re-render while loading.
// Otherwise, it's a bit jarring when the content structure disappears everytime you click next/prev.
const PersistedContent = memo(
  function PersistedContent({ loading, data }: { loading: boolean; data: any }) {
    const router = useRouter();
    const contentBase = useRef(null);
    const item = useRef(null);
    const nav = useRef(null);
    const swipeListener = useRef(null);
    const [currentCanonicalUrl, setCurrentCanonicalUrl] = useState(null);
    const styles = useStyles({ template: data?.fetchContent?.template });

    useEffect(() => {
      if (loading || !data.fetchContent) {
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
        swipeListener?.current && swipeListener.current.off();
        swipeListener.current = null;
      };
    }, [loading, data, router, currentCanonicalUrl]);

    useEffect(() => {
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    });

    function setupSwipe() {
      if (swipeListener.current || !contentBase.current) {
        return;
      }

      swipeListener.current = SwipeListener(contentBase.current);
      contentBase.current.addEventListener('swipe', (e) => {
        const directions = e.detail.directions;

        if (directions.left) {
          nav.current && nav.current.prev();
        } else if (directions.right) {
          nav.current && nav.current.next();
        }
      });
    }

    if (loading) {
      return null;
    }

    const content = data.fetchContent;

    if (!content) {
      return <NotFound />;
    }

    if (content.template === 'blank') {
      return (
        <div id="hw-content">
          <Simple content={content} />
        </div>
      );
    }

    const contentOwner = data.fetchPublicUserData;
    const comments = data.fetchCommentsRemote;
    const favorites = data.fetchFavoritesRemote;
    const itemEl =
      content.template === 'feed' ? (
        <Feed content={content} />
      ) : (
        <Item
          content={content}
          contentOwner={contentOwner}
          comments={comments}
          favorites={favorites}
          handleEdit={handleEdit}
          ref={item}
        />
      );
    const title = (content.title ? content.title + ' – ' : '') + contentOwner.title;

    return (
      <ContentBase
        ref={contentBase}
        content={content}
        contentOwner={contentOwner}
        title={title}
        username={content.username}
      >
        <StyledContent $isFeedWrapper={content.template === 'feed'}>
          <Nav ref={nav} content={content} />
          {itemEl}
        </StyledContent>
      </ContentBase>
    );
  },
  (prevProps, nextProps) => {
    return nextProps.loading;
  }
);
