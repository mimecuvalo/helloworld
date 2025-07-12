import { NextWebVitalsMetric } from 'next/app';

export function trackWebVitals(metric: NextWebVitalsMetric): void {
  console.debug('web vitals', metric);
}
