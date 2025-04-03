export interface CloneResponse {
  html: string;
  baseUrl: string;
}

export interface ScrapedAsset {
  url: string;
  type: 'image' | 'font' | 'css' | 'js';
  data: Buffer;
  optimizedUrl?: string;
}

export interface ScrapedData {
  html: string;
  assets: ScrapedAsset[];
  baseUrl: string;
}

export interface CacheConfig {
  type: 'local' | 's3';
  s3?: {
    bucket: string;
    region: string;
  };
  local?: {
    directory: string;
  };
}

export interface AssetCacheResult {
  url: string;
  key: string;
  contentType: string;
} 