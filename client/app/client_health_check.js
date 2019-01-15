import configuration from './configuration';

// This lets us make sure that if there are bad / incompatible clients in the wild later on, we can
// disable certain clients using their version number and timestamp and making sure they're upgraded to the
// latest, working version.
async function runCheck() {
  const response = await fetch('/api/client-health-check', {
    method: 'POST',
    body: JSON.stringify({
      appVersion: configuration.appVersion,
      appTime: configuration.appTime,
      _csrf: configuration.csrf,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.text();

  // We've been told that we are a bad client. We need to refresh.
  if (data === 'bad') {
    window.location.reload();
  }

  // If you'd like you can also implement here a 'soft reload' functionality.
  // If the server sends down a code to reload when it gets the chance (instead of via ajax), you can
  // tell the App to do a hard navigation at the next opportunity.
}

export default function clientHealthCheck() {
  setInterval(runCheck, 5 * 60 * 1000 /* every 5 min */);
}
