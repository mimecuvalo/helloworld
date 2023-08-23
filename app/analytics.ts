const INTERESTING_ELEMENTS = ['a', 'button', 'img', 'input'];

type LogData = {
  localName: string;
  name: string;
  pageName: string;
};

function logEvent(eventName: string, data: LogData) {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      eventName,
      data,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function handleMouseDown(evt: MouseEvent) {
  let target = evt.target as HTMLElement;
  if (!target) {
    return;
  }
  let localName = target.localName;

  while (
    !INTERESTING_ELEMENTS.includes(localName) &&
    !(target.getAttribute && ['listbox', 'option', 'button'].includes(target.getAttribute('role') || ''))
  ) {
    target = target.parentNode as HTMLElement;
    if (!target) {
      return;
    }
    localName = target.localName;
  }

  const aria = target.getAttribute('aria-describedby');
  const tooltip = aria && document.getElementById(aria)?.innerText;
  const name =
    tooltip ||
    target.getAttribute('data-track') ||
    target.getAttribute('aria-label') ||
    target.title ||
    target.innerText ||
    target.getAttribute('placeholder') ||
    target.getAttribute('name') ||
    target.getAttribute('alt') ||
    target.id ||
    target.className ||
    (target as HTMLImageElement).src ||
    (target as HTMLImageElement).srcset;
  const pageName = window.location.pathname.split('/')[1] || '/';

  // Conditionally compile this code. Should not appear in production.
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[analytics] ${pageName} → ${localName} → ${name}`);
  }

  logEvent('click', {
    localName,
    name,
    pageName,
  });
}

export function setupAnalytics() {
  if (typeof window !== 'undefined') {
    window.addEventListener('mousedown', handleMouseDown);
  }
}

export function disposeAnalytics() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousedown', handleMouseDown);
  }
}
