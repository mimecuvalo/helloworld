import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, drawSelection, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
  type LanguageSupport,
} from '@codemirror/language';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import styles from './editor.module.css';

export type CodeLanguage = 'html' | 'css' | 'javascript';

const LANGUAGES: Record<CodeLanguage, () => LanguageSupport> = {
  html: () => html(),
  css: () => css(),
  javascript: () => javascript(),
};

// CodeMirror paints its own colors, and the content themes swap the ground out
// from under it — so let everything but the syntax highlighting inherit.
const inheritTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: 'inherit', fontSize: '0.875rem' },
  '&.cm-focused': { outline: 'none' },
  '.cm-content': { fontFamily: 'var(--font-mono, ui-monospace, monospace)', padding: '8px 0' },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'inherit', border: 0, opacity: 0.4 },
  '.cm-activeLine': { backgroundColor: 'var(--hw-menu-hover, rgb(0 0 0 / 6%))' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--hw-primary-light, rgb(0 0 0 / 20%))',
  },
});

// Uncontrolled on purpose: rewriting the document from a prop on every keystroke
// fights the cursor. The editor's tabs unmount this when you leave them, so the
// initial value is always the current one.
export default function CodeEditor({
  ariaLabel,
  language,
  onChange,
  value,
}: {
  ariaLabel: string;
  language: CodeLanguage;
  onChange: (value: string) => void;
  value: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  // The view is created once; reading the latest handler off a ref keeps a new
  // onChange identity from tearing it down mid-edit.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          highlightActiveLine(),
          indentOnInput(),
          bracketMatching(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          // `indentWithTab` last: it has to win over the browser's own tab.
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
          inheritTheme,
          LANGUAGES[language](),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });

    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return <div ref={hostRef} className={styles.codeEditor} />;
}
