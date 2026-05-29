const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('../config');

const keepAliveAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 3000, maxSockets: 64, timeout: 30000 });
const keepAliveAgentHttps = new https.Agent({ keepAlive: true, keepAliveMsecs: 3000, maxSockets: 64, timeout: 30000 });

const instance = axios.create({
  httpAgent: keepAliveAgent,
  httpsAgent: keepAliveAgentHttps,
});

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

async function fetch(url, options = {}) {
  const response = await instance({
    url,
    headers: { ...defaultHeaders, ...options.headers },
    timeout: options.timeout || 15000,
    responseType: options.responseType || 'text',
    maxRedirects: options.maxRedirects || 5,
    ...options,
  });
  return response;
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, { ...options, responseType: 'json' });
  return response.data;
}

async function fetchBuffer(url, options = {}) {
  const response = await fetch(url, { ...options, responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

module.exports = { fetch, fetchJSON, fetchBuffer };
