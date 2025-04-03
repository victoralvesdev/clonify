interface CacheEntry {
  data: any;
  timestamp: number;
}

class MediaCache {
  private cache: Map<string, CacheEntry>;
  private readonly TTL: number = 3600000; // 1 hora em milissegundos

  constructor() {
    this.cache = new Map();
  }

  set(key: string, value: any): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se o cache expirou
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Limpar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    });
  }
}

export const mediaCache = new MediaCache();

// Executar limpeza a cada hora
setInterval(() => {
  mediaCache.cleanup();
}, 3600000); 