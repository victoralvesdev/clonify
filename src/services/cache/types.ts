export interface CacheConfig {
  directory: string;
}

export interface CachedAsset {
  url: string;
  localPath: string;
  mimeType: string;
} 