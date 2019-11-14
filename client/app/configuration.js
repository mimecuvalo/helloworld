let configuration;

if (typeof window !== 'undefined') {
  configuration = window.configuration || {};
} else if (process.env.NODE_ENV === 'test') {
  configuration = {
    locale: 'en',
  };
}

export default configuration;
