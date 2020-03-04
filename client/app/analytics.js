import configuration from './configuration';

const INTERESTING_ELEMENTS = ['a', 'button', 'img', 'input'];

function logEvent(eventName, data) {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      eventName,
      data,
      _csrf: configuration.csrf,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function handleMouseDown(evt) {
  let target = evt.target;
  let localName = target.localName;

  while (!INTERESTING_ELEMENTS.includes(localName)) {
    target = target.parentNode;
    if (!target) {
      return;
    }
    localName = target.localName;
  }

  const aria = target.getAttribute('aria-describedby');
  const tooltip = aria && document.getElementById(aria).innerText;
  const name =
    tooltip ||
    target.getAttribute('data-track') ||
    target.getAttribute('aria-label') ||
    target.title ||
    target.id ||
    target.innerText ||
    target.getAttribute('placeholder') ||
    target.getAttribute('name') ||
    target.getAttribute('alt') ||
    target.className ||
    target.src ||
    target.srcset;
  const pageName = window.location.pathname.split('/')[1] || '/';

  // Conditionally compile this code. Should not appear in production.
  if (process.env.NODE_ENV === 'development') {
    console.log(`${pageName}: ${localName}: ${name}`);
  }

  logEvent('click', {
    localName,
    name,
    pageName,
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('mousedown', handleMouseDown);
  });
}
