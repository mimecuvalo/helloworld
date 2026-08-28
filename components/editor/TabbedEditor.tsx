import { lazy, Suspense, type ReactNode } from 'react';
import { F } from 'i18n';
import styles from './editor.module.css';

// CodeMirror is a quarter of a megabyte that most edits never touch — leave it
// out of the chunk that opening an editor pulls down.
const CodeEditor = lazy(() => import('./CodeEditor'));

export const TABS = ['content', 'html', 'css', 'js', 'options'] as const;
export type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, ReactNode> = {
  content: <F defaultMessage="Content" />,
  html: <F defaultMessage="HTML" />,
  css: <F defaultMessage="CSS" />,
  js: <F defaultMessage="JS" />,
  options: <F defaultMessage="Options" />,
};

// The chrome both editors share: the tab strip, and the three source views onto
// a row's view/style/code. What sits behind Content and Options differs — one
// edits a post that exists, the other one that doesn't yet — so those arrive as
// nodes and are mounted only while their tab is the one showing.
export default function TabbedEditor({
  actions,
  code,
  content,
  footer,
  isPending,
  onCodeChange,
  onStyleChange,
  onTabChange,
  onViewChange,
  options,
  placement,
  style,
  tab,
  view,
}: {
  actions?: ReactNode;
  code: string;
  content: ReactNode;
  footer?: ReactNode;
  isPending?: boolean;
  onCodeChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onTabChange: (tab: Tab) => void;
  onViewChange: (value: string) => void;
  options: ReactNode;
  placement?: ReactNode;
  style: string;
  tab: Tab;
  view: string;
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.tabs} role="tablist" aria-label="editor">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            className={`${styles.tab} ${tab === name ? styles.tabActive : ''}`}
            onClick={() => onTabChange(name)}
          >
            {TAB_LABELS[name]}
          </button>
        ))}
        {placement || actions ? (
          <div className={styles.tabAside}>
            {placement}
            {actions}
          </div>
        ) : null}
      </div>

      {isPending ? (
        <div className={styles.panelLoading} aria-busy="true" />
      ) : (
        <div className={styles.panelBody} role="tabpanel">
          {tab === 'content' ? content : null}
          {tab === 'html' || tab === 'css' || tab === 'js' ? (
            <Suspense fallback={<div className={styles.panelLoading} aria-busy="true" />}>
              {tab === 'html' ? (
                <CodeEditor ariaLabel="html" language="html" value={view} onChange={onViewChange} />
              ) : tab === 'css' ? (
                <CodeEditor ariaLabel="css" language="css" value={style} onChange={onStyleChange} />
              ) : (
                <CodeEditor ariaLabel="js" language="javascript" value={code} onChange={onCodeChange} />
              )}
            </Suspense>
          ) : null}
          {tab === 'options' ? options : null}
          {footer}
        </div>
      )}
    </div>
  );
}
