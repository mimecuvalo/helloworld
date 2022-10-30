import { NextWebVitalsMetric } from 'next/app';

export function reportWebVitals(metric: NextWebVitalsMetric): void {
  console.debug('web vitals', metric);
}
