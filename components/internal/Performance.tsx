import { useEffect, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import styles from './dev.module.css';

const WEB_VITALS_NAME_TO_READABLE: Record<string, string> = {
  CLS: 'cumulative-layout-shift (Web Vital)',
  FID: 'first-input-delay (Web Vital)',
  FCP: 'first-contentful-paint (Web Vital)',
  LCP: 'largest-contentful-paint (Web Vital)',
  TTFB: 'time-to-first-byte (Web Vital)',
};

// Insight into initial render timing. Relies on window.performance entries.
export default function Performance() {
  const [duration, setDuration] = useState(0);
  const [navigationEntry, setNavigationEntry] = useState<PerformanceEntry | null>(null);
  const [paintEntries, setPaintEntries] = useState<PerformanceEntryList | null>(null);

  useEffect(() => {
    if (!window.performance) return;

    function perfCallback() {
      const nav = window.performance.getEntriesByType('navigation')[0];
      const paint = window.performance.getEntriesByType('paint');
      if (nav) setDuration(nav.duration);
      setNavigationEntry(nav ?? null);
      setPaintEntries(paint);
    }

    const observer = new PerformanceObserver(perfCallback);
    observer.observe({ entryTypes: ['navigation', 'paint'] });
    perfCallback();

    return () => observer.disconnect();
  }, []);

  function renderPerfInfo() {
    if (!navigationEntry || !paintEntries) return null;

    const entries: Record<string, number> = { ...navigationEntry.toJSON() };
    paintEntries.forEach((entry) => {
      entries[entry.name] = entry.startTime;
    });

    const relevantTimingKeys = [
      'redirectStart',
      'redirectEnd',
      'fetchStart',
      'domainLookupStart',
      'domainLookupEnd',
      'connectStart',
      'secureConnectionStart',
      'connectEnd',
      'requestStart',
      'responseStart',
      'responseEnd',
      'first-paint',
      'domInteractive',
      'domContentLoadedEventStart',
      'domContentLoadedEventEnd',
      'domComplete',
      'loadEventStart',
      'loadEventEnd',
      'CLS',
      'FID',
      'FCP',
      'LCP',
      'TTFB',
    ];

    return (
      <table className={styles.table}>
        <tbody>
          {relevantTimingKeys
            .filter((timing) => !!entries[timing])
            .sort((a, b) => entries[a] - entries[b])
            .map((timing) => (
              <tr key={timing}>
                <td>
                  <strong>{WEB_VITALS_NAME_TO_READABLE[timing] ?? timing}</strong>
                </td>
                <td>{entries[timing].toFixed(1)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger className={styles.devButton} data-error={duration > 5000} aria-haspopup="true">
        {duration ? duration.toFixed(1) + 'ms' : '…'}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} side="top">
          <Popover.Popup className={styles.popup}>{renderPerfInfo()}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
