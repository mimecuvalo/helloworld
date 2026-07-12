import { useEffect, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import axe from 'axe-core';
import styles from './dev.module.css';

// Accessibility audit of the current page via axe-core. Dev-only.
export default function A11y() {
  const [errorCount, setErrorCount] = useState(0);
  const [results, setResults] = useState<axe.AxeResults | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    // Wait a tick so the audit doesn't block the app's main render.
    const timeoutId = setTimeout(() => runAudit(), 0);
    setLoaded(true);
    return () => clearTimeout(timeoutId);
  }, [loaded]);

  function runAudit() {
    console.debug('[a11y]: running accessibility audit...');
    try {
      axe.run(document, {}, (err, res) => {
        if (err) throw err;
        console.debug('[a11y]:', res);
        setErrorCount(res.violations.length + res.incomplete.length);
        setResults(res);
      });
    } catch (ex) {
      console.error(ex);
    }
  }

  function handleRerun() {
    setErrorCount(0);
    setResults(null);
    setLoaded(false);
  }

  function renderIssueByType(typeFilter: string) {
    if (!results) return null;
    const allIssues = [
      ...results.violations.map((v) => ({ ...v, type: 'violation' as const })),
      ...results.incomplete.map((i) => ({ ...i, type: 'incomplete' as const })),
    ];
    const issuesByType = allIssues.filter((issue) => issue.impact === typeFilter);
    if (!issuesByType.length) return null;

    const setOutline = (target: string, outline: string) =>
      document.querySelector(target)?.setAttribute('style', outline);

    return (
      <div>
        <h3 style={{ textTransform: 'capitalize' }}>{typeFilter}</h3>
        <ul>
          {issuesByType.map((issue) => (
            <li key={issue.id} className={styles.issue}>
              <strong>{issue.type === 'violation' ? '⚠️ Violation' : '⚙️ Incomplete'}</strong>{' '}
              <strong>{issue.id}</strong> <span>{issue.description}</span>
              <pre>
                {issue.nodes.map((node, idx) => (
                  <div
                    key={idx}
                    onMouseOver={() => setOutline(node.target as unknown as string, 'outline: 3px solid hotpink')}
                    onMouseOut={() => setOutline(node.target as unknown as string, '')}
                  >
                    {node.target}
                  </div>
                ))}
              </pre>
              {issue.helpUrl ? (
                <a href={issue.helpUrl} target="_blank" rel="noopener noreferrer">
                  More info
                </a>
              ) : (
                <span>No more info</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function renderResults() {
    if (!results) return null;
    return (
      <div>
        <button type="button" className={`${styles.devButton} ${styles.reRun}`} onClick={handleRerun}>
          Re-run audits
        </button>
        <h2>Issues</h2>
        {results.violations.length || results.incomplete.length ? null : <div>No issues!</div>}
        {renderIssueByType('critical')}
        {renderIssueByType('serious')}
        {renderIssueByType('moderate')}
        {renderIssueByType('minor')}
        <div>
          <strong>Passing tests</strong>: {results.passes.length}
        </div>
        <div>
          <strong>Inapplicable tests</strong>: {results.inapplicable.length}
        </div>
        <div>See console output for more detailed information.</div>
      </div>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger className={`${styles.devButton} notranslate`} data-error={errorCount > 0} aria-haspopup="true">
        a11y ({errorCount})
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} side="top">
          <Popover.Popup className={styles.popup}>{renderResults()}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
