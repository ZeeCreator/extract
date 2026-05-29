const { detectProvider } = require('./detector');
const { extract, extractWithRetry } = require('./extractor');

module.exports = { detectProvider, extract, extractWithRetry };
