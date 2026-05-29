const logger = require('../utils/logger');

class MemoryCache {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) {
      this.misses++;
      return null;
    }
    if (this.ttls.has(key) && Date.now() > this.ttls.get(key)) {
      this.store.delete(key);
      this.ttls.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return item;
  }

  async set(key, value, ttlSeconds) {
    this.store.set(key, value);
    if (ttlSeconds) {
      this.ttls.set(key, Date.now() + (ttlSeconds * 1000));
    }
  }

  async del(key) {
    this.store.delete(key);
    this.ttls.delete(key);
  }

  clear() {
    this.store.clear();
    this.ttls.clear();
    this.hits = 0;
    this.misses = 0;
  }

  stats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
    };
  }
}

module.exports = new MemoryCache();
