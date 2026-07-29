export function logError(data: unknown) {
  try {
    fetch('/api/report-error', {
      method: 'POST',
      body: JSON.stringify({ data }),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {}
}

const reportedGlobalErrors = new WeakSet<object>();

function reportGlobalError(error: unknown) {
  if (error instanceof Error && error.message === 'Transition was skipped') return;
  if (typeof error === 'object' && error !== null) {
    if (reportedGlobalErrors.has(error)) return;
    reportedGlobalErrors.add(error);
  }
  const value = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
  logError({ ...value, url: window.location.href, userAgent: navigator.userAgent });
}

let registered = false;

// Catches errors that escape React's boundaries (event handlers, async work).
// Called from getRouter() on the client; safe to call more than once.
export function registerGlobalErrorHandlers() {
  if (registered) return;
  registered = true;
  window.addEventListener('error', (event) => reportGlobalError(event.error || event.message));
  window.addEventListener('unhandledrejection', (event) => reportGlobalError(event.reason));
}
