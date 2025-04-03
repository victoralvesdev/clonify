export interface ScrapedAsset {
  url: string;
  hash: string;
  mimeType: string;
}

export interface ScrapedData {
  html: string;
  assets: ScrapedAsset[];
  baseUrl: string;
} 