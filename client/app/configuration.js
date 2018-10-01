let configuration;

if (typeof window !== 'undefined') {
  configuration = window.configuration;
} else {
  configuration = {};
}

export default configuration;
