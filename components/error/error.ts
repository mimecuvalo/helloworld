export function logError(data: any) {
  fetch('/api/report-error', {
    method: 'POST',
    body: JSON.stringify({
      data,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
