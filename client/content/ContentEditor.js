import './CodeMirror.css';
import AppBar from '@material-ui/core/AppBar';
import { buildUrl } from '../../shared/util/url_factory';
import classNames from 'classnames';
import configuration from '../app/configuration';
import { createUseStyles } from 'react-jss';
//import { Editor } from 'hello-world-editor';
import ErrorBoundary from '../error/ErrorBoundary';
import { F } from 'react-intl-wrapper';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

let CodeMirror;

// TODO(mime): move this somewhere more re-usable - same as Simple.js - keep in sync.
const useStyles = createUseStyles({
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

export default React.forwardRef((props, ref) => {
  const { album, content = {}, mentions, onMediaAdd, section, showPlaceholder } = props;
  const contentEditor = useRef(null);
  const codeMirrorCSS = useRef(null);
  const codeMirrorJS = useRef(null);
  const [code, setCode] = useState(null);
  const [editorContent, setEditorContent] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [style, setStyle] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const styles = useStyles();

  useEffect(() => {
    async function getCodeMirror() {
      // We don't import this at the top because server-side, holy god, what a mess.
      CodeMirror = (await import('react-codemirror')).default;
      await import('codemirror/mode/css/css');
      await import('codemirror/mode/javascript/javascript');
    }
    getCodeMirror();
  }, []);

  useEffect(() => {
    setLoaded(true);

    const handleOnBeforeUnload = (evt) => {
      if (hasUnsavedChanges) {
        evt.returnValue = 'You have unfinished changes!';
      }
    };
    window.addEventListener('beforeunload', handleOnBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleOnBeforeUnload);
  }, [hasUnsavedChanges, setLoaded]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    switch (tabValue) {
      case 0:
        contentEditor.current && contentEditor.current.focus();
        break;
      case 1:
        codeMirrorCSS.current && codeMirrorCSS.current.getCodeMirror().focus();
        break;
      case 2:
        codeMirrorJS.current && codeMirrorJS.current.getCodeMirror().focus();
        break;
      default:
        break;
    }
  }, [tabValue, loaded]);

  useImperativeHandle(ref, () => ({
    setUnsavedChanges: (hasUnsavedChanges) => {
      setHasUnsavedChanges(hasUnsavedChanges);
      contentEditor.current && contentEditor.current.setUnsavedChanges(hasUnsavedChanges);
    },

    export: () => {
      return {
        style: style || content?.style || '',
        code: code || content?.code || '',
        content: editorContent || content?.content,
      };
    },

    clear: () => {
      setHasUnsavedChanges(false);
      setStyle(null);
      setCode(null);
      setEditorContent(null);

      contentEditor.current && contentEditor.current.clear();
      codeMirrorCSS.current && codeMirrorCSS.current.getCodeMirror().setValue('');
      codeMirrorJS.current && codeMirrorJS.current.getCodeMirror().setValue('');
    },

    getContentEditor: () => contentEditor.current,
  }));

  const handleStyleChange = (style) => {
    setHasUnsavedChanges(true);
    setStyle(style);
  };

  const handleCodeChange = (code) => {
    setHasUnsavedChanges(true);
    setCode(code);
  };

  const handleContentChange = () => {
    setHasUnsavedChanges(true);
    setEditorContent(contentEditor.current.export());
  };

  const handleMediaAdd = (fileInfos) => onMediaAdd && onMediaAdd(fileInfos);

  const handleTabChange = (evt, tabValue) => setTabValue(tabValue);

  const handleMediaUpload = async (body) => {
    body.append('section', content?.section || section);
    body.append('album', content?.album || album);

    return await fetch(buildUrl({ pathname: '/api/upload' }), {
      method: 'POST',
      body,
      headers: { 'x-csrf-token': configuration.csrf },
    });
  };

  const handleLinkUnfurl = async (url) => {
    return await fetch(buildUrl({ pathname: '/api/unfurl' }), {
      method: 'POST',
      body: JSON.stringify({
        url,
        _csrf: configuration.csrf,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const codeMirrorOptions = {
    lineNumbers: true,
  };

  let tab = (
    <div key="content" className={classNames(styles.view, 'hw-view')}>
      {/* <Editor
        content={editorContent ? { content: editorContent, style, code } : content}
        ref={contentEditor}
        mentions={mentions}
        onChange={handleContentChange}
        onMediaAdd={handleMediaAdd}
        onMediaUpload={handleMediaUpload}
        onLinkUnfurl={handleLinkUnfurl}
        showPlaceholder={showPlaceholder}
        locale={configuration.locale}
      /> */}
    </div>
  );

  if (loaded) {
    switch (tabValue) {
      case 1:
        tab = (
          <CodeMirror
            ref={codeMirrorCSS}
            key="css"
            value={style || content.style}
            onChange={handleStyleChange}
            options={Object.assign({ mode: 'css' }, codeMirrorOptions)}
          />
        );
        break;
      case 2:
        tab = (
          <CodeMirror
            ref={codeMirrorJS}
            key="js"
            value={code || content.code}
            onChange={handleCodeChange}
            options={Object.assign({ mode: 'javascript' }, codeMirrorOptions)}
          />
        );
        break;
      default:
        break;
    }
  }

  return (
    <>
      <AppBar position="static">
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={<F msg="Content" />} />
          <Tab label={<F msg="CSS" />} />
          <Tab label={<F msg="JS" />} />
        </Tabs>
      </AppBar>

      <ErrorBoundary>{tab}</ErrorBoundary>
    </>
  );
});
