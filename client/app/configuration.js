let configuration;

if (typeof window !== 'undefined') {
  configuration = window.configuration || {};
} else if (process.env.NODE_ENV === 'test') {
  configuration = {
    locale: 'en',
  };
} else {
  // TODO(mime): move to local_state? and/or set on the server-side somewhere.
  configuration = {
    locale: 'en',
  };
}

export default configuration;
