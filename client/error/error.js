import configuration from '../app/configuration';

export function logError(data) {
  fetch('/api/report-error', {
    method: 'POST',
    body: JSON.stringify({
      data,
      _csrf: configuration.csrf,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
