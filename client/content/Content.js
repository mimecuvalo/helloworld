import { buildUrl, contentUrl } from '../../shared/util/url_factory';
import classNames from 'classnames';
import ContentBase from './ContentBase';
import ContentQuery from './ContentQuery';
import { convertFromRaw, EditorState } from 'draft-js';
import { createUseStyles } from 'react-jss';
import { defineMessages, useIntl } from 'react-intl-wrapper';
//import { EditorUtils } from 'hello-world-editor';
import Feed from './Feed';
import gql from 'graphql-tag';
import isMobile from 'is-mobile';
import Item from './Item';
import Nav from './Nav';
import NotFound from '../error/404';
import React, { useEffect, useRef, useState } from 'react';
import Simple from './templates/Simple';
import SwipeListener from 'swipe-listener';
import { useHistory } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useSnackbar } from 'notistack';

const useStyles = createUseStyles({
  content: {
    margin: 'var(--app-margin)',
    padding: '0 3px 10px 3px',
    width: '100%',
    '@media only screen and (max-width: 600px)': {
      '&': {
        width: 'auto',
      },
    },
  },

  feedWrapper: {
    display: 'flex',
    flexDirection: 'row',
    flexFlow: 'wrap',
    alignItems: 'flex-start',
  },
});

const messages = defineMessages({
  error: { msg: 'Error updating content.' },
});

const SAVE_CONTENT = gql`
  mutation saveContent(
    $name: String!
    $hidden: Boolean!
    $title: String!
    $thumb: String!
    $style: String!
    $code: String!
    $content: String!
  ) {
    saveContent(
      name: $name
      hidden: $hidden
      title: $title
      thumb: $thumb
      style: $style
      code: $code
      content: $content
    ) {
      username
      name
      hidden
      title
      thumb
      style
      code
      content
    }
  }
`;

export default function Content(props) {
  const {
    match: {
      params: { username, name },
    },
  } = props;

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
const PersistedContent = React.memo(
  function PersistedContent({ loading, data }) {
    const intl = useIntl();
    const routerHistory = useHistory();
    const snackbar = useSnackbar();
    const contentBase = useRef(null);
    const item = useRef(null);
    const nav = useRef(null);
    const swipeListener = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCanonicalUrl, setCurrentCanonicalUrl] = useState(null);
    const [saveContent] = useMutation(SAVE_CONTENT);
    const styles = useStyles();

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
          routerHistory.replace(canonicalUrl);
        }
        setCurrentCanonicalUrl(canonicalUrl);
      }

      setupSwipe();
    }, [loading, data, routerHistory, currentCanonicalUrl]);

    useEffect(() => {
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        swipeListener?.current && swipeListener.current.off();
        document.removeEventListener('keydown', handleKeyDown);
      };
    });

    useEffect(() => {
      item?.current?.getEditor() && item.current.getEditor().setUnsavedChanges(!isEditing);
    }, [isEditing]);

    const handleKeyDown = (evt) => {
      if (!isEditing) {
        return;
      }

      // TODO(mime): combine this logic somewhere. (also in keyboard.js)
      const isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
      const isAccelKey = isMac ? evt.metaKey : evt.ctrlKey;
      if (isAccelKey && evt.key === 's') {
        handleEdit();
      }
    };

    function setupSwipe() {
      if (!isMobile({ tablet: true })) {
        return;
      }

      if (swipeListener?.current || !contentBase.current) {
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

    const handleEdit = (evt) => {
      if (isEditing) {
        performSaveContent();
      }

      setIsEditing(!isEditing);
    };

    async function performSaveContent() {
      const { username, name, thumb } = data.fetchContent;
      const editor = item.current.getEditor();
      const content = editor.export();

      // TODO(mime): gotta be a simpler way then all this conversion.
      const title = ''; //EditorUtils.Text.getTextForLine(EditorState.createWithContent(convertFromRaw(content.content)), 0);

      const newThumb = editor.getContentEditor().fileInfo?.thumb || thumb || '';

      const variables = {
        username,
        name,
        hidden: false, // TODO(mime)
        title,
        thumb: newThumb,
        content: JSON.stringify(content.content),
        style: content.style,
        code: content.code,
      };

      try {
        await saveContent({
          variables,
          optimisticResponse: {
            __typename: 'Mutation',
            saveContent: Object.assign({}, variables, { __typename: 'Content' }),
          },
        });
      } catch (ex) {
        snackbar.enqueueSnackbar(intl.formatMessage(messages.error), { variant: 'error' });
      }
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
          isEditing={isEditing}
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
        <article className={classNames(styles.content, { [styles.feedWrapper]: content.template === 'feed' })}>
          {isEditing ? null : <Nav ref={nav} content={content} isEditing={isEditing} />}
          {itemEl}
        </article>
      </ContentBase>
    );
  },
  (prevProps, nextProps) => {
    return nextProps.loading;
  }
);
