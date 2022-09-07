import { Suspense, forwardRef, lazy, useImperativeHandle, useRef } from 'react';

import classNames from 'classnames';
import { createUseStyles } from 'react-jss';

// TODO(mime): move this somewhere more re-usable - same as ContentEditor.js - keep in sync.
export const useStyles = createUseStyles({
  view: {
    position: 'relative',
    clear: 'both',
    '& img, & iframe, & object, & embed': {
      maxHeight: '82vh',
      maxWidth: '50vw',
      margin: '10px',
    },
    '& figure img:hover': {
      outline: '3px solid #0bf',
    },

    '@media only screen and (max-width: 600px)': {
      '& figure': {
        margin: 0,
      },
      '& img, & iframe, & object, & embed': {
        maxHeight: '82vh',
        maxWidth: '100vw',
        margin: '10px',
      },
    },
  },
});

export default forwardRef(({ content, isEditing, isFeed }, ref) => {
  const editor = useRef(null);
  const styles = useStyles();

  useImperativeHandle(ref, () => ({
    getEditor: () => editor.current,
  }));

  // TODO(mime): Suspense and lazy aren't supported by ReactDOMServer yet (breaks SSR).
  if (isEditing && typeof window !== 'undefined') {
    const ContentEditor = lazy(() => import('client/content/ContentEditor'));
    return (
      <Suspense fallback={<div />}>
        <ContentEditor ref={editor} content={content} />
      </Suspense>
    );
  }

  return (
    <>
      {isFeed ? null : <div dangerouslySetInnerHTML={{ __html: content.style }} />}
      {isFeed ? null : <div dangerouslySetInnerHTML={{ __html: content.code }} />}
      <div
        dangerouslySetInnerHTML={{ __html: content.view }}
        className={classNames('e-content', styles.view, 'hw-view', 'notranslate')}
      />
    </>
  );
});