class CacheManager {
  private cache = new Map<string, any>();
  private cacheTimestamps = new Map<string, number>();
  private maxCacheSize = 1000;
  private defaultTTL = 300000; // 5 minutes default

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now() + ttl);
  }

  get<T>(key: string): T | null {
    const timestamp = this.cacheTimestamps.get(key);
    
    if (!timestamp || Date.now() > timestamp) {
      // Cache expired
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Infinity;

    for (const [key, timestamp] of this.cacheTimestamps) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  // Memory-efficient bulk operations
  setMany<T>(entries: Array<[string, T, number?]>): void {
    for (const [key, value, ttl] of entries) {
      this.set(key, value, ttl);
    }
  }

  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const timestamp of this.cacheTimestamps.values()) {
      if (now > timestamp) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalSize: this.cache.size,
      validEntries,
      expiredEntries,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): number {
    // Rough estimate in bytes
    let size = 0;
    for (const [key, value] of this.cache) {
      size += key.length * 2; // UTF-16
      size += JSON.stringify(value).length * 2;
    }
    return size;
  }

  // Preload weather data for visible regions
  async preloadRegionData(bounds: { north: number; south: number; east: number; west: number }): Promise<void> {
    const gridSize = 5; // 5-degree grid
    const promises: Promise<void>[] = [];

    for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
      for (let lng = bounds.west; lng <= bounds.east; lng += gridSize) {
        const key = `weather_${Math.round(lat)}_${Math.round(lng)}`;
        
        if (!this.has(key)) {
          promises.push(this.fetchAndCacheWeatherData(lat, lng, key));
        }
      }
    }

    await Promise.all(promises);
  }

  private async fetchAndCacheWeatherData(lat: number, lng: number, key: string): Promise<void> {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lng}&` +
        `current_weather=true&forecast_days=1`
      );

      if (response.ok) {
        const data = await response.json();
        this.set(key, data, 600000); // Cache for 10 minutes
      }
    } catch (error) {
      console.warn('Failed to preload weather data:', error);
    }
  }
}

export const cacheManager = new CacheManager();