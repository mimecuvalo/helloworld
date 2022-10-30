import { Content } from 'data/graphql-generated';
import ReactMarkdown from 'react-markdown';
import { constructNextImageURL } from 'util/url-factory';
import { omit } from 'lodash';
import rehypeRaw from 'rehype-raw';
import { styled } from 'components';

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

const customRenderers = {
  // N.B. This div/span wrapper matches the structure, more or less, of the Outline editor's img wrapper.
  // eslint-disable-next-line
  img: (props: any) => (
    <span className={`image image-${props.title || ''}`}>
      <span className="image-inner-wrapper">
        {/* eslint-disable-next-line */}
        <img
          {...omit(props, 'node', 'src')}
          className="u-photo"
          src={process.env.IS_STORYBOOK ? props.src : constructNextImageURL(props.src)}
        />
      </span>
      <span className="caption">{props.alt}</span>
    </span>
  ),

  /* XXX: react-markdown sometimes renders a lone \ - we hide these. See data-text code above. */
  p: (props: any) => (
    <p
      data-text={props.children.toString().includes('[object Object]') ? undefined : props.children}
      {...omit(props, 'node')}
    >
      {props.children}
    </p>
  ),
};

export default function Simple({
  content,
  isFeed,
}: {
  content: Pick<Content, 'title' | 'style' | 'code' | 'view' | 'content'>;
  isEditing?: boolean;
  isFeed?: boolean;
}) {
  // if (isEditing && typeof window !== 'undefined') {
  //   const ContentEditor = lazy(() => import('content/ContentEditor'));
  //   return (
  //     <Suspense fallback={<div />}>
  //       <ContentEditor ref={editor} content={content} />
  //     </Suspense>
  //   );
  // }

  const lines = content.content.split('\n');
  const title = lines[0].replace(/^# /, '');
  const contentWithMaybeTitle = title === content.title ? lines.slice(1).join('\n') : content.content;

  return (
    <>
      {isFeed ? null : <div dangerouslySetInnerHTML={{ __html: content.style }} />}
      {isFeed ? null : <div dangerouslySetInnerHTML={{ __html: content.code }} />}
      {content.content ? (
        <View className="e-content hw-view notranslate">
          <ReactMarkdown components={customRenderers} rehypePlugins={[rehypeRaw]}>
            {contentWithMaybeTitle}
          </ReactMarkdown>
        </View>
      ) : (
        // Legacy that just had straight-up HTML.
        <View
          dangerouslySetInnerHTML={{ __html: content.view.replaceAll('<p></p>', '') }}
          className="e-content hw-view notranslate"
        />
      )}
    </>
  );
}
