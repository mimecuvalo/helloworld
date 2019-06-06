const genericNames = require('generic-names');
const interpolator = genericNames('[name]__[local]___[hash:base64:5]', {
  context: process.cwd(),
});

module.exports = function generate(name, filename, css) {
  return /\.module\.css$/.test(filename) ? interpolator(name, filename) : `${name}`;
}