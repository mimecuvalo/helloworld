import { Content } from 'data/graphql-generated';
import { styled } from 'components';
import { useEditor } from 'application/EditorContext';
import { lazy, Suspense, useContext } from 'react';
import UserContext from 'application/UserContext';

const ContentEditor = lazy(() => import('../ContentEditor'));

const View = styled('div', { label: 'SimpleView' })`
  position: relative;
  clear: both;

  padding: ${(props) => props.theme.spacing(0, 1)};

  & figure img:hover {
    outline: 3px solid ${(props) => props.theme.palette.primary.main};
  }

  /* XXX: react-markdown sometimes renders a lone \ - we hide these. See data-text code below. */
  p[data-text='\\\\'] {
    visibility: hidden;
  }
`;

export default function Simple({ content, isFeed }: { content: Content; isEditing?: boolean; isFeed?: boolean }) {
  const { isEditing } = useEditor();
  const { user } = useContext(UserContext);
  const isOwnerViewing = user?.username === content.username;

  return (
    <>
      {isOwnerViewing ? (
        <Suspense fallback={<div />}>
          <ContentEditor content={content} />
        </Suspense>
      ) : null}
      {isEditing ? null : (
        <>
          {isFeed ? null : <div dangerouslySetInnerHTML={{ __html: content.style }} />}
          {isFeed ? null : <div dangerouslySetInnerHTML={{ __html: content.code }} />}
          <View
            dangerouslySetInnerHTML={{ __html: content.view.replaceAll('<p></p>', '') }}
            className="e-content hw-view notranslate"
          />
        </>
      )}
    </>
  );
}
