import { ReportHandler } from 'web-vitals';

type WebVitals = 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB';

export const reportWebVitals = (onPerfEntry: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

enum EventAction {
  // Performance Tracking
  CLS = 'Cumulative Layout Shift (*1000)',
  FCP = 'First Contentful Paint (ms)',
  FID = 'First Input Delay (ms)',
  LCP = 'Largest Contentful Paint (ms)',
  TTFB = 'Time to First Byte (ms)',
}

/**
 * Callback passed to web-vitals to report important performance events
 */
export function trackWebVitals({ name, delta, id }: { name: WebVitals; delta: number; id: string }): void {
  console.debug(
    'web vitals',
    EventAction[name],
    // The `id` value will be unique to the current page load. When sending
    // multiple values from the same page (e.g. for CLS), Google Analytics can
    // compute a total by grouping on this ID (note: requires `eventLabel` to
    // be a dimension in your report).
    id,
    // Google Analytics metrics must be integers, so the value is rounded.
    // For CLS the value is first multiplied by 1000 for greater precision
    // (note: increase the multiplier for greater precision if needed).
    Math.round(name === 'CLS' ? delta * 1000 : delta),
    // Use a non-interaction event to avoid affecting bounce rate.
    true,
    // Use `sendBeacon()` if the browser supports it.
    'beacon'
  );
}
