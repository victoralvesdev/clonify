import { FacebookAd } from '@/types/facebook';

interface FacebookAdsAPIConfig {
  accessToken: string;
  apiVersion: string;
}

class FacebookAdsAPI {
  private config: FacebookAdsAPIConfig;
  private baseUrl: string;

  constructor(config: FacebookAdsAPIConfig) {
    this.config = config;
    this.baseUrl = `https://graph.facebook.com/v${config.apiVersion}`;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const queryParams = new URLSearchParams({
      access_token: this.config.accessToken,
      ...params
    });

    const response = await fetch(`${this.baseUrl}${endpoint}?${queryParams}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facebook API Error: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  async searchAds(params: {
    searchTerms?: string;
    adType?: string;
    adReachCountries?: string[];
    limit?: number;
  }): Promise<FacebookAd[]> {
    try {
      const searchParams: Record<string, string> = {
        search_terms: params.searchTerms || '',
        ad_type: params.adType || 'ALL',
        ad_reached_countries: params.adReachCountries?.join(',') || '',
        limit: String(params.limit || 25),
        fields: [
          'id',
          'ad_archive_id',
          'ad_creative_bodies',
          'ad_creative_link_titles',
          'ad_creative_link_descriptions',
          'ad_delivery_start_time',
          'ad_delivery_stop_time',
          'page_id',
          'page_name',
          'publisher_platforms',
          'demographic_distribution',
          'impressions',
          'spend',
          'currency',
          'region_distribution',
          'ad_snapshot_url'
        ].join(',')
      };

      const result = await this.request<{data: FacebookAd[]}>('/ads_archive', searchParams);
      return result.data;
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
      throw error;
    }
  }

  async getAdDetails(adArchiveId: string): Promise<FacebookAd> {
    try {
      const params = {
        fields: [
          'id',
          'ad_archive_id',
          'ad_creative_bodies',
          'ad_creative_link_titles',
          'ad_creative_link_descriptions',
          'ad_delivery_start_time',
          'ad_delivery_stop_time',
          'page_id',
          'page_name',
          'publisher_platforms',
          'demographic_distribution',
          'impressions',
          'spend',
          'currency',
          'region_distribution',
          'ad_snapshot_url'
        ].join(',')
      };

      return this.request<FacebookAd>(`/ads_archive/${adArchiveId}`, params);
    } catch (error) {
      console.error('Erro ao buscar detalhes do anúncio:', error);
      throw error;
    }
  }
}

// Criar instância com configuração do .env
export const facebookAdsAPI = new FacebookAdsAPI({
  accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
  apiVersion: '18.0' // Versão mais recente da API
}); 