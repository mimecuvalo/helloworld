import { useEffect, useRef } from 'react';
import { EditorState, Prec } from '@codemirror/state';
import { EditorView, drawSelection, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput, type LanguageSupport } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
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

// One Dark for the syntax colors and its editing chrome — cursor, selection,
// matching brackets, panels — all of which are tuned for a dark ground. What it
// doesn't get to pick is the ground itself: #282c34 is a grey slab next to the
// page, so the editor and its gutter keep the content theme's own background.
//
// The colors it replaced were `defaultHighlightStyle`, a light-mode palette
// (#708, #219, #164) that had been sitting on nightlight's near-black #161313.
//
// Prec.high because this and One Dark set `&` and `.cm-gutters` at equal
// specificity: whichever mounts last wins, and precedence is what decides that.
const localTheme = Prec.high(
  EditorView.theme({
    '&': { backgroundColor: 'var(--hw-bg)', fontSize: '0.875rem' },
    '&.cm-focused': { outline: 'none' },
    '.cm-gutters': { backgroundColor: 'var(--hw-bg)' },
    '.cm-content': { fontFamily: 'var(--font-mono, ui-monospace, monospace)', padding: '8px 0' },
  })
);

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
          // `indentWithTab` last: it has to win over the browser's own tab.
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
          oneDark,
          localTheme,
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
