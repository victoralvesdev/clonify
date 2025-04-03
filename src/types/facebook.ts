export interface FacebookAd {
  id: string;
  ad_archive_id?: string;
  ad_creative_bodies: string[];
  ad_creative_link_titles: string[];
  ad_creative_link_descriptions: string[];
  ad_delivery_start_time: string;
  ad_delivery_stop_time: string | null;
  page_id: string;
  page_name?: string;
  publisher_platforms: string[];
  demographic_distribution: {
    age: string;
    gender: string;
    percentage: number;
  }[];
  impressions: {
    lower_bound: number;
    upper_bound: number;
  };
  spend: {
    lower_bound: number;
    upper_bound: number;
    currency: string;
  };
  currency: string;
  region_distribution: {
    region: string;
    percentage: number;
  }[];
  ad_snapshot_url?: string;
  media_type?: string;
  media_urls?: {
    image?: string;
    video?: string;
  };
  active_ads_count?: number;
  link_url?: string;
  snapshot?: {
    videos?: Array<{
      video_preview_image_url?: string;
      video_sd_url?: string;
      video_hd_url?: string;
    }>;
    body?: {
      markup?: {
        __html: string;
      };
      text?: string;
    };
    title?: string;
    link_description?: string;
    page_name?: string;
    page_id?: string;
    display_format?: string;
    images?: string[];
  };
  text?: string;
  platform?: string;
  country?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
} 