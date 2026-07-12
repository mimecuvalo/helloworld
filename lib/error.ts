export function logError(data: unknown) {
  try {
    fetch('/api/report-error', {
      method: 'POST',
      body: JSON.stringify({ data }),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {}
}
