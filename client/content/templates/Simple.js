import { forwardRef, useImperativeHandle, useRef } from 'react';

import ContentEditor from 'client/content/ContentEditor';
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
  },
});

export default forwardRef(({ content, isEditing, isFeed }, ref) => {
  const editor = useRef(null);
  const styles = useStyles();

  useImperativeHandle(ref, () => ({
    getEditor: () => editor.current,
  }));

  if (isEditing) {
    return <ContentEditor ref={editor} content={content} />;
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
