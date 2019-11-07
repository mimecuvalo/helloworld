let configuration;

if (typeof window !== 'undefined') {
  configuration = window.configuration || {};
} else {
  configuration = {
    locale: 'en',
  };
}

export default configuration;
