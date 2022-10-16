import { Content } from 'data/graphql-generated';
import { styled } from 'components';

const View = styled('div')`
  position: relative;
  clear: both;

  & img,
  & iframe,
  & object,
  & embed {
    max-height: 82vh;
    max-width: 50vw;
    margin: 10px;
  }

  & figure img:hover {
    outline: 3px solid #0bf;
  }

  @media only screen and (max-width: 600px) {
    & figure {
      margin: 0;
    }

    & img,
    & iframe,
    & object,
    & embed {
      max-height: 82vh;
      max-width: 100vw;
      margin: 10px;
    }
  }
`;

export default function Simple({
  content,
  isFeed,
}: {
  content: Pick<Content, 'style' | 'code' | 'view'>;
  isEditing?: boolean;
  isFeed?: boolean;
}) {
  // TODO(mime): fix up
  //const editor = useRef(null);
  //
  // useImperativeHandle(ref, () => ({
  //   getEditor: () => editor.current,
  // }));

  // // TODO(mime): Suspense and lazy aren't supported by ReactDOMServer yet (breaks SSR).
  // if (isEditing && typeof window !== 'undefined') {
  //   const ContentEditor = lazy(() => import('content/ContentEditor'));
  //   return (
  //     <Suspense fallback={<div />}>
  //       <ContentEditor ref={editor} content={content} />
  //     </Suspense>
  //   );
  // }

  return (
    <>
      {isFeed ? null : <div dangerouslySetInnerHTML={{ __html: content.style }} />}
      {isFeed ? null : <div dangerouslySetInnerHTML={{ __html: content.code }} />}
      <View dangerouslySetInnerHTML={{ __html: content.view }} className="e-content hw-view notranslate" />
    </>
  );
}
