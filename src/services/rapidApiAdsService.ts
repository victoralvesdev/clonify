import { FacebookAd } from '@/types/facebook';

interface RapidApiConfig {
  apiKey: string;
  baseUrl: string;
  host: string;
}

interface SearchParams {
  query?: string;
  country_code?: string;
  state?: string;
  platform?: string;
  media_types?: string;
  active_status?: string;
  page_id?: string;
  continuation_token?: string | null;
}

class RapidApiAdsService {
  private config: RapidApiConfig;

  constructor(config: RapidApiConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, params: Record<string, any> = {}, method: 'GET' | 'POST' = 'GET'): Promise<T> {
    // Remover parâmetros undefined ou null
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    console.log('Parâmetros limpos:', cleanParams);

    const queryParams = new URLSearchParams(
      Object.entries(cleanParams).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return acc;
      }, {} as Record<string, string>)
    );

    const url = `${this.config.baseUrl}${endpoint}${method === 'GET' ? `?${queryParams.toString()}` : ''}`;
    
    console.log('Fazendo requisição para:', url);
    console.log('Método:', method);
    console.log('Headers:', {
      'X-RapidAPI-Key': this.config.apiKey ? '***' : 'MISSING',
      'X-RapidAPI-Host': this.config.host,
      'Content-Type': 'application/json'
    });

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-RapidAPI-Key': this.config.apiKey,
          'X-RapidAPI-Host': this.config.host,
          'Content-Type': 'application/json'
        },
        ...(method === 'POST' && {
          body: JSON.stringify(cleanParams)
        })
      });

      console.log('Status da resposta:', response.status);
      console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        try {
          const error = JSON.parse(errorText);
          throw new Error(`RapidAPI Error: ${error.message || 'Unknown error'}`);
        } catch {
          throw new Error(`RapidAPI Error: ${errorText || response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Resposta recebida:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('Erro na requisição RapidAPI:', error);
      throw error;
    }
  }

  async searchAds(params: {
    searchTerms?: string;
    state?: string;
    minActiveAds?: number;
  }): Promise<FacebookAd[]> {
    try {
      // Verificar configurações da API
      if (!this.config.apiKey || !this.config.baseUrl || !this.config.host) {
        throw new Error('Configuração da API RapidAPI incompleta.');
      }

      let allAds: any[] = [];
      let continuationToken: string | null = null;
      const seenPageIds = new Set<string>(); // Controle de páginas já vistas
      const maxRequests = 3; // Número máximo de requisições para evitar loop infinito
      let requestCount = 0;

      do {
        // Preparar os parâmetros da busca
      const searchParams: SearchParams = {
          query: params.searchTerms || 'renda_extra',
          country_code: 'BR',
          continuation_token: continuationToken
        };

        console.log(`Fazendo requisição ${requestCount + 1} com token:`, continuationToken);
        
        const result = await this.request<any>('/meta/search/ads', searchParams, 'GET');
        
        if (!result.results || !Array.isArray(result.results)) {
          console.log('Nenhum resultado encontrado nesta página');
          break;
        }

        // Log para depuração dos dados de contagem
        console.log('Dados de contagem do primeiro anúncio:', {
          collationCount: result.results[0]?.collationCount,
          active_ads_count: result.results[0]?.active_ads_count,
          ads_count: result.results[0]?.ads_count,
          copies_count: result.results[0]?.copies_count,
          copies_length: result.results[0]?.copies?.length,
          similar_ads_count: result.results[0]?.similar_ads_count,
          similar_ads_length: result.results[0]?.similar_ads?.length,
          copies_keys: result.results[0]?.copies ? Object.keys(result.results[0].copies).length : 0
        });

        // Processar os anúncios desta página
        const newAds = result.results.flat().filter((ad: any) => {
          const pageId = ad.pageID || ad.snapshot?.page_id;
          if (!pageId || seenPageIds.has(pageId)) {
            return false; // Pular anúncios sem pageId ou de páginas já vistas
          }
          seenPageIds.add(pageId);
          return true;
        });

        allAds = [...allAds, ...newAds];
        console.log(`Total de anúncios únicos até agora: ${allAds.length}`);

        // Atualizar o token de continuação
        continuationToken = result.continuation_token;
        requestCount++;

        // Continuar se temos token e não atingimos o limite de requisições
      } while (continuationToken && requestCount < maxRequests);

      console.log(`Total final de anúncios únicos: ${allAds.length}`);

      // Mapear os anúncios para nosso formato FacebookAd e filtrar por quantidade de anúncios ativos
      const mappedAds = allAds.map((ad: any) => {
        const videoData = ad.snapshot?.videos?.[0] || {};
        const imageData = ad.snapshot?.images || ad.images || [];
        
        // Extrair URL da imagem de várias fontes possíveis
        let imageUrl = null;
        if (Array.isArray(imageData)) {
          // Se imageData é um array de objetos
          if (typeof imageData[0] === 'object') {
            imageUrl = imageData[0].resized_image_url || null;
          }
        }
        // Se imageData é um objeto único
        else if (typeof imageData === 'object') {
          imageUrl = imageData.resized_image_url || null;
        }

        // Log para debug das informações de mídia
        console.log('Dados de mídia do anúncio:', {
          id: ad.adArchiveID || ad.adid,
          imageData,
          videoData,
          extractedImageUrl: imageUrl,
          extractedVideoUrl: videoData.video_sd_url || null
        });

        // Calcular o número de anúncios ativos
        const activeAdsCount = ad.collationCount || 
                             ad.active_ads_count || 
                             ad.ads_count || 
                             ad.copies_count ||
                             ad.copies?.length ||
                             ad.similar_ads_count ||
                             ad.similar_ads?.length ||
                             (ad.copies && Object.keys(ad.copies).length) ||
                             1;
        
        return {
          id: ad.adArchiveID || ad.adid || `anuncio-${Math.random()}`,
          ad_archive_id: ad.adArchiveID || ad.adid,
          ad_creative_bodies: [ad.snapshot?.body?.markup?.__html || ''].filter(Boolean),
          ad_creative_link_titles: [ad.snapshot?.title || ''].filter(Boolean),
          ad_creative_link_descriptions: [ad.snapshot?.link_description || ''].filter(Boolean),
          ad_delivery_start_time: new Date(ad.startDate * 1000).toISOString(),
          ad_delivery_stop_time: ad.endDate ? new Date(ad.endDate * 1000).toISOString() : null,
          page_id: ad.pageID || ad.snapshot?.page_id,
          page_name: ad.pageName || ad.snapshot?.page_name || 'Desconhecido',
          publisher_platforms: ad.publisherPlatform || ['facebook'],
          demographic_distribution: [],
          impressions: {
            lower_bound: 0,
            upper_bound: 0
          },
          spend: {
            lower_bound: 0,
            upper_bound: 0,
            currency: ad.currency || 'BRL'
          },
          currency: ad.currency || 'BRL',
          region_distribution: [],
          ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${ad.adArchiveID}`,
          media_type: videoData.video_sd_url ? 'video' : (imageUrl ? 'image' : 'unknown'),
          media_urls: {
            image: imageUrl,
            video: videoData.video_sd_url || null
          },
          active_ads_count: activeAdsCount,
          link_url: ad.snapshot?.link_url || ad.link_url || null
        };
      }).filter(ad => (ad.active_ads_count || 0) >= (params.minActiveAds || 1)); // Usar o parâmetro minActiveAds

      console.log(`Total de anúncios após filtro (>= ${params.minActiveAds || 1} ativos): ${mappedAds.length}`);
      return mappedAds;

    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
      throw new Error(`Erro ao acessar a API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Função para processar os anúncios (extraída para evitar duplicação)
  private processarAnuncios(adsData: any[], searchTerm?: string): FacebookAd[] {
    // Log detalhado dos dados recebidos para depuração
    console.log('==== DADOS BRUTOS RECEBIDOS DA API ====');
    console.log(JSON.stringify(adsData, null, 2));
    
    // Verificar o primeiro anúncio para entender a estrutura
    if (adsData.length > 0) {
      console.log('Exemplo de anúncio (primeiro da lista):', JSON.stringify(adsData[0], null, 2));
      console.log('Propriedades do primeiro anúncio:', Object.keys(adsData[0]));
      
      // Fazer uma análise recursiva das propriedades para identificar campos úteis
      const camposEncontrados = this.analisarObjetoRecursivamente(adsData[0]);
      console.log('🔍 Campos potencialmente úteis encontrados recursivamente:', camposEncontrados);
    }

    // Mapear resultado para nosso tipo FacebookAd
    const mappedAds = adsData.map((ad, index) => {
      // Log mais detalhado de cada anúncio
      console.log(`Processando anúncio #${index}:`, ad);
      
      // Verificamos se temos dados aninhados em propriedades específicas
      // Para o endpoint /meta/page/ads, os dados estão diretamente no objeto principal
      
      // Extrair informações do anúncio de forma mais robusta, começando com o ID
      // Para /meta/page/ads, os IDs geralmente estão diretamente nas propriedades principais
      const adId = ad.id || ad.adId || ad.ad_id || ad.adArchiveID || ad.ad_archive_id || `anuncio-${index}`;
      console.log(`ID extraído: ${adId}`);
      
      // Obter o nome da página e ID da página
      const pageName = ad.page_name || ad.pageName || ad.advertiser_name || 'Desconhecido';
      console.log(`Nome da página: ${pageName}`);
      
      const pageId = ad.page_id || ad.pageID || '';
      console.log(`ID da página: ${pageId}`);
      
      // Extrair textos do anúncio
      let bodies: string[] = [];
      
      // Para resultados do /meta/page/ads, verificar primeiro message, body ou text
      if (ad.message && typeof ad.message === 'string') {
        bodies = [ad.message];
      } else if (ad.body && typeof ad.body === 'string') {
        bodies = [ad.body];
      } else if (ad.text && typeof ad.text === 'string') {
        bodies = [ad.text];
      } else if (ad.ad_creative_bodies && Array.isArray(ad.ad_creative_bodies)) {
        bodies = ad.ad_creative_bodies;
      } else if (ad.ad_creative_body && typeof ad.ad_creative_body === 'string') {
        bodies = [ad.ad_creative_body];
      } else if (ad.content && typeof ad.content === 'string') {
        bodies = [ad.content];
      }
      
      // Verificar se há textos em outras estruturas
      if (bodies.length === 0 && ad.snapshot && ad.snapshot.body) {
        const snapshotBody = typeof ad.snapshot.body === 'string' 
          ? ad.snapshot.body 
          : ad.snapshot.body?.markup?.__html || ad.snapshot.body?.text || '';
        if (snapshotBody) bodies = [snapshotBody];
      }
      
      // Se ainda não temos corpos, procuramos em outras propriedades comuns
      if (bodies.length === 0) {
        const possibleBodySources = [
          ad.caption, ad.description, ad.headline
        ];
        
        for (const source of possibleBodySources) {
          if (source && typeof source === 'string' && source.trim().length > 0) {
            bodies.push(source);
            break;
          }
        }
      }
      
      // Se ainda não encontramos nada, procuramos recursivamente por qualquer texto
      if (bodies.length === 0) {
        const textosEncontrados = this.extrairTextosRecursivamente(ad);
        if (textosEncontrados.length > 0) {
          bodies = [textosEncontrados[0]]; // Usar o primeiro texto encontrado
        }
      }
      
      console.log(`Textos extraídos:`, bodies);
      
      // Extrair títulos (para /meta/page/ads, geralmente em title, headline ou caption)
      let titles: string[] = [];
      if (ad.title && typeof ad.title === 'string') {
        titles = [ad.title];
      } else if (ad.headline && typeof ad.headline === 'string') {
        titles = [ad.headline];
      } else if (ad.caption && typeof ad.caption === 'string') {
        titles = [ad.caption];
      } else if (ad.ad_creative_link_titles && Array.isArray(ad.ad_creative_link_titles)) {
        titles = ad.ad_creative_link_titles;
      } else if (ad.ad_creative_link_title && typeof ad.ad_creative_link_title === 'string') {
        titles = [ad.ad_creative_link_title];
      }
      
      console.log(`Títulos extraídos:`, titles);
      
      // Extrair descrições
      let descriptions: string[] = [];
      if (ad.description && typeof ad.description === 'string') {
        descriptions = [ad.description];
      } else if (ad.subtitle && typeof ad.subtitle === 'string') {
        descriptions = [ad.subtitle];
      } else if (ad.ad_creative_link_descriptions && Array.isArray(ad.ad_creative_link_descriptions)) {
        descriptions = ad.ad_creative_link_descriptions;
      } else if (ad.ad_creative_link_description && typeof ad.ad_creative_link_description === 'string') {
        descriptions = [ad.ad_creative_link_description];
      }
      
      console.log(`Descrições extraídas:`, descriptions);
      
      // Extrair plataformas (em /meta/page/ads, geralmente em platforms)
      let platforms: string[] = ['facebook'];
      if (ad.platforms && Array.isArray(ad.platforms)) {
        platforms = ad.platforms;
      } else if (ad.platform && typeof ad.platform === 'string') {
        platforms = [ad.platform];
      } else if (ad.publisher_platforms && Array.isArray(ad.publisher_platforms)) {
        platforms = ad.publisher_platforms;
      }
      
      console.log(`Plataformas extraídas:`, platforms);
      
      // Extrair URLs de mídia
      let imageUrl = null;
      
      // Para /meta/page/ads, a imagem geralmente está em thumbnail_url ou images
      if (ad.thumbnail_url && typeof ad.thumbnail_url === 'string') {
        imageUrl = ad.thumbnail_url;
      } else if (ad.image_url && typeof ad.image_url === 'string') {
        imageUrl = ad.image_url;
      } else if (ad.images && Array.isArray(ad.images) && ad.images.length > 0) {
        // Pode ser um array de objetos com url ou um array de strings
        imageUrl = typeof ad.images[0] === 'string' ? ad.images[0] : 
                  ad.images[0].url || ad.images[0].src || ad.images[0].href || ad.images[0];
      }
      
      // Verificar se a imageUrl parece ser válida
      if (imageUrl && !this.pareceUrlValida(imageUrl)) {
        console.log(`⚠️ URL de imagem não parece válida:`, imageUrl);
        imageUrl = null;
      }
      
      console.log(`URL da imagem:`, imageUrl);
      
      // Extrair URL do vídeo
      let videoUrl = null;
      if (ad.video_url && typeof ad.video_url === 'string') {
        videoUrl = ad.video_url;
      } else if (ad.videos && Array.isArray(ad.videos) && ad.videos.length > 0) {
        videoUrl = ad.videos[0].video_sd_url || ad.videos[0].video_hd_url || 
                  ad.videos[0].url || ad.videos[0].src || ad.videos[0];
      }
      
      // Verificar se a videoUrl parece ser válida
      if (videoUrl && !this.pareceUrlValida(videoUrl)) {
        console.log(`⚠️ URL de vídeo não parece válida:`, videoUrl);
        videoUrl = null;
      }
      
      console.log(`URL do vídeo:`, videoUrl);
      
      // Determinar datas (para /meta/page/ads, geralmente em start_date/end_date)
      const startDate = ad.start_date || ad.startDate || ad.creation_time || 
                      ad.creationTime || new Date().toISOString();
      const endDate = ad.end_date || ad.endDate || null;
      console.log(`Data início: ${startDate}, Data fim: ${endDate}`);

      // Pegar link para o anúncio
      const adSnapshotUrl = ad.ad_snapshot_url || ad.adSnapshotUrl || 
                          ad.snapshot_url || ad.snapshotUrl || 
                          `https://www.facebook.com/ads/library/?id=${adId}`;
                          
      console.log(`URL do anúncio:`, adSnapshotUrl);

      // Criar o objeto final mapeado
      const mappedAd: FacebookAd = {
        id: adId,
        ad_archive_id: adId,
        ad_creative_bodies: bodies.length > 0 ? bodies : [`Anúncio #${adId} sem descrição disponível`],
        ad_creative_link_titles: titles.length > 0 ? titles : [`Anúncio #${adId}`],
        ad_creative_link_descriptions: descriptions,
        ad_delivery_start_time: startDate,
        ad_delivery_stop_time: endDate,
        page_id: String(pageId),
        page_name: pageName || 'Página não identificada',
        publisher_platforms: platforms,
          demographic_distribution: ad.demographic_distribution || [],
        impressions: {
          lower_bound: (ad.impressions?.lower_bound) || 0,
          upper_bound: (ad.impressions?.upper_bound) || 0
        },
          spend: {
            lower_bound: ad.spend?.lower_bound || 0,
            upper_bound: ad.spend?.upper_bound || 0,
            currency: ad.currency || 'USD'
          },
          currency: ad.currency || 'USD',
          region_distribution: ad.region_distribution || [],
        ad_snapshot_url: adSnapshotUrl,
        media_type: videoUrl ? 'video' : (imageUrl ? 'image' : 'unknown'),
          media_urls: {
          image: imageUrl,
          video: videoUrl
        },
        active_ads_count: ad.collationCount || 
                        ad.active_ads_count || 
                        ad.ads_count || 
                        ad.copies_count ||
                        ad.copies?.length ||
                        ad.similar_ads_count ||
                        ad.similar_ads?.length ||
                        (ad.copies && Object.keys(ad.copies).length) ||
                        1,
        link_url: ad.snapshot?.link_url || ad.link_url || null
      };
      
      // Garantir que o ID não é genérico se temos os dados corretos
      if (mappedAd.id.startsWith('anuncio-') && ad.id) {
        console.log('⚠️ Substituindo ID genérico pelo ID real:', ad.id);
        mappedAd.id = ad.id;
        mappedAd.ad_archive_id = ad.id;
      }
      
      return mappedAd;
    });

    // Exibir dados processados no console
    console.log('==== DADOS PROCESSADOS ====');
    console.log(JSON.stringify(mappedAds, null, 2));

      console.log(`Mapeados ${mappedAds.length} anúncios com sucesso`);
      return mappedAds;
  }
  
  // Função auxiliar para analisar recursivamente um objeto em busca de campos úteis
  private analisarObjetoRecursivamente(obj: any, caminho: string = '', resultado: Record<string, string> = {}, 
                                     visitados: Set<any> = new Set()): Record<string, string> {
    // Evitar loops infinitos com objetos circulares
    if (visitados.has(obj)) return resultado;
    
    // Adicionar objeto atual ao conjunto de visitados
    visitados.add(obj);
    
    // Se não for um objeto, retornar resultado atual
    if (obj === null || typeof obj !== 'object') return resultado;
    
    // Procurar por campos que podem conter dados relevantes
    const camposInteressantes = ['id', 'ad_id', 'adArchiveID', 'ad_archive_id', 'page_id', 'pageID', 
                               'page_name', 'pageName', 'advertiser_name', 'title', 'description', 
                               'body', 'message', 'text', 'content', 'image_url', 'video_url', 
                               'images', 'videos', 'thumbnail_url', 'preview_url'];
    
    // Verificar campos do objeto atual
    for (const chave in obj) {
      const valor = obj[chave];
      const caminhoCompleto = caminho ? `${caminho}.${chave}` : chave;
      
      // Se encontrarmos um campo interessante com valor, armazenar
      if (camposInteressantes.includes(chave) && valor !== null && valor !== undefined && valor !== '') {
        if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') {
          resultado[caminhoCompleto] = String(valor);
        } else if (Array.isArray(valor) && valor.length > 0) {
          resultado[caminhoCompleto] = `Array com ${valor.length} item(s)`;
        } else if (typeof valor === 'object') {
          resultado[caminhoCompleto] = 'Objeto';
        }
      }
      
      // Recursivamente analisar objetos e arrays
      if (typeof valor === 'object' && valor !== null) {
        if (Array.isArray(valor)) {
          // Para arrays, analisar o primeiro item se existir
          if (valor.length > 0) {
            this.analisarObjetoRecursivamente(valor[0], `${caminhoCompleto}[0]`, resultado, visitados);
          }
        } else {
          this.analisarObjetoRecursivamente(valor, caminhoCompleto, resultado, visitados);
        }
      }
    }
    
    return resultado;
  }
  
  // Função para extrair textos recursivamente de um objeto
  private extrairTextosRecursivamente(obj: any, resultado: string[] = [], visitados: Set<any> = new Set()): string[] {
    // Evitar loops infinitos
    if (visitados.has(obj)) return resultado;
    visitados.add(obj);
    
    // Se for uma string com pelo menos 10 caracteres, adicionar ao resultado
    if (typeof obj === 'string' && obj.trim().length >= 10) {
      resultado.push(obj.trim());
      return resultado;
    }
    
    // Se não for um objeto ou array, retornar
    if (obj === null || typeof obj !== 'object') return resultado;
    
    // Para arrays, processar cada item
    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.extrairTextosRecursivamente(item, resultado, visitados);
      }
    } else {
      // Para objetos, processar cada propriedade
      for (const chave in obj) {
        this.extrairTextosRecursivamente(obj[chave], resultado, visitados);
      }
    }
    
    return resultado;
  }
  
  // Função para verificar se uma string parece uma URL válida
  private pareceUrlValida(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    // Verificar se começa com http:// ou https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    
    // Verificar se tem um domínio razoável
    try {
      const urlObj = new URL(url);
      return !!urlObj.hostname && urlObj.hostname.includes('.');
    } catch (e) {
      return false;
    }
  }

  // Função para exibir dados no console de forma amigável
  private exibirDadosDebug(dados: any) {
    // Exibir no console
    console.log('==== DADOS PROCESSADOS ====');
    console.log(JSON.stringify(dados, null, 2));
    
    // Se estamos no navegador, tentar criar uma visualização na página
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      setTimeout(() => {
        try {
          // Verificar se o container já existe
          let container = document.getElementById('dados-debug-container');
          if (!container) {
            // Criar container se não existir
            container = document.createElement('div');
            container.id = 'dados-debug-container';
            container.style.position = 'fixed';
            container.style.bottom = '10px';
            container.style.right = '10px';
            container.style.maxWidth = '400px';
            container.style.maxHeight = '400px';
            container.style.overflow = 'auto';
            container.style.backgroundColor = 'rgba(0,0,0,0.8)';
            container.style.color = 'white';
            container.style.padding = '10px';
            container.style.borderRadius = '5px';
            container.style.zIndex = '9999';
            container.style.fontSize = '12px';
            
            // Adicionar botão para fechar
            const closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '5px';
            closeButton.style.right = '5px';
            closeButton.style.backgroundColor = 'red';
            closeButton.style.border = 'none';
            closeButton.style.borderRadius = '3px';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = () => container?.remove();
            container.appendChild(closeButton);
            
            // Adicionar título
            const title = document.createElement('h3');
            title.textContent = 'Dados Processados';
            title.style.marginBottom = '10px';
            title.style.borderBottom = '1px solid white';
            container.appendChild(title);
            
            document.body.appendChild(container);
          }
          
          // Limpar conteúdo existente
          const dataContainer = document.createElement('div');
          
          // Processar dados conforme o tipo
          if (Array.isArray(dados)) {
            dados.forEach((item, index) => {
              const card = document.createElement('div');
              card.style.marginBottom = '10px';
              card.style.padding = '5px';
              card.style.border = '1px solid #555';
              card.style.borderRadius = '3px';
              
              // ID do anúncio
              const idElement = document.createElement('p');
              idElement.innerHTML = `<strong>ID:</strong> <span style="color:#aaffaa">${item.id || 'N/A'}</span>`;
              card.appendChild(idElement);
              
              // Título
              if (item.ad_creative_link_titles?.length) {
                const title = document.createElement('p');
                title.innerHTML = `<strong>Título:</strong> ${item.ad_creative_link_titles[0]}`;
                card.appendChild(title);
              }
              
              // Corpo do anúncio
              if (item.ad_creative_bodies?.length) {
                const body = document.createElement('p');
                body.innerHTML = `<strong>Texto:</strong> ${item.ad_creative_bodies[0].substring(0, 100)}${item.ad_creative_bodies[0].length > 100 ? '...' : ''}`;
                card.appendChild(body);
              }
              
              // Página
              const pageElement = document.createElement('p');
              pageElement.innerHTML = `<strong>Página:</strong> ${item.page_name || 'Desconhecida'}`;
              card.appendChild(pageElement);
              
              // Imagem do anúncio, se disponível
              if (item.media_urls?.image) {
                const imgContainer = document.createElement('div');
                imgContainer.style.marginTop = '5px';
                imgContainer.style.textAlign = 'center';
                
                const img = document.createElement('img');
                img.src = item.media_urls.image;
                img.alt = 'Imagem do anúncio';
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100px';
                img.style.objectFit = 'contain';
                
                imgContainer.appendChild(img);
                card.appendChild(imgContainer);
              }
              
              dataContainer.appendChild(card);
            });
          } else {
            // Exibir objeto diretamente
            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(dados, null, 2);
            dataContainer.appendChild(pre);
          }
          
          container.appendChild(dataContainer);
        } catch (err) {
          console.error('Erro ao criar visualização de debug:', err);
        }
      }, 1000);
    }
  }

  async getPageAds(params: {
    pageId: string;
    country?: string;
    minActiveAds?: number;
  }): Promise<FacebookAd[]> {
    try {
      console.log('Buscando anúncios da página:', params.pageId);

      const searchParams: SearchParams = {
        page_id: params.pageId,
        country_code: params.country?.toUpperCase() || 'BR',
      };

      console.log('Usando parâmetros:', searchParams);

      // Usando o endpoint exato mostrado no exemplo curl
      console.log('Tentando endpoint "/meta/page/ads"...');
      const result = await this.request<{
        data: any[];
        continuation_token: string | null;
      }>('/meta/page/ads', searchParams, 'GET');

      console.log('Resposta recebida:', result);

      // Mapear resultado para nosso tipo FacebookAd
      const ads = result.data.map(ad => {
        // Calcular o número de anúncios ativos
        const activeAdsCount = ad.collationCount || 
                             ad.active_ads_count || 
                             ad.ads_count || 
                             ad.copies_count ||
                             ad.copies?.length ||
                             ad.similar_ads_count ||
                             ad.similar_ads?.length ||
                             (ad.copies && Object.keys(ad.copies).length) ||
                             1;

        return {
        id: ad.id,
        ad_archive_id: ad.ad_archive_id || ad.id,
        ad_creative_bodies: Array.isArray(ad.ad_creative_bodies) ? ad.ad_creative_bodies : [ad.message || ad.ad_creative_body].filter(Boolean),
        ad_creative_link_titles: Array.isArray(ad.ad_creative_link_titles) ? ad.ad_creative_link_titles : [ad.title || ad.ad_creative_link_title].filter(Boolean),
        ad_creative_link_descriptions: Array.isArray(ad.ad_creative_link_descriptions) ? ad.ad_creative_link_descriptions : [ad.description || ad.ad_creative_link_description].filter(Boolean),
        ad_delivery_start_time: ad.start_date || ad.creation_time,
        ad_delivery_stop_time: ad.end_date,
        page_id: ad.page_id,
        page_name: ad.page_name,
        publisher_platforms: Array.isArray(ad.platforms) ? ad.platforms : [ad.platform || 'facebook'],
        demographic_distribution: ad.demographic_distribution || [],
        impressions: ad.impressions || { lower_bound: 0, upper_bound: 0 },
        spend: {
          lower_bound: ad.spend?.lower_bound || 0,
          upper_bound: ad.spend?.upper_bound || 0,
          currency: ad.currency || 'USD'
        },
        currency: ad.currency || 'USD',
        region_distribution: ad.region_distribution || [],
        ad_snapshot_url: ad.ad_snapshot_url,
        media_type: ad.media_type,
        media_urls: {
          image: ad.images?.[0] || ad.thumbnail_url,
          video: ad.videos?.[0]
          },
          active_ads_count: activeAdsCount,
          link_url: ad.snapshot?.link_url || ad.link_url || null
        };
      }).filter(ad => (ad.active_ads_count || 0) >= (params.minActiveAds || 1)); // Filtrar apenas anúncios com 20 ou mais anúncios ativos

      console.log(`Total de anúncios após filtro (>= ${params.minActiveAds || 1} ativos): ${ads.length}`);

      return ads;
    } catch (error) {
      console.error('Erro ao buscar anúncios da página:', error);
      throw error;
    }
  }

  async getPageDetails(pageId: string): Promise<{
    id: string;
    name: string;
    category: string;
    followers: number;
    verified: boolean;
    country: string;
    disclaimer?: string;
  }> {
    try {
      console.log('Buscando detalhes da página:', pageId);

      // Usando o endpoint exato mostrado no exemplo curl
      console.log('Tentando endpoint "/meta/page/details"...');
      const result = await this.request<{
        data: any;
      }>('/meta/page/details', { page_id: pageId }, 'GET');

      console.log('Resposta recebida:', result);

      const page = result.data;

      return {
        id: page.id,
        name: page.name,
        category: page.category,
        followers: page.followers_count,
        verified: page.verified,
        country: page.country,
        disclaimer: page.disclaimer
      };
    } catch (error) {
      console.error('Erro ao buscar detalhes da página:', error);
      throw error;
    }
  }
}

// Exportar instância única do serviço
export const rapidApiAdsService = new RapidApiAdsService({
  apiKey: process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
  baseUrl: process.env.NEXT_PUBLIC_RAPIDAPI_URL || '',
  host: process.env.NEXT_PUBLIC_RAPIDAPI_HOST || ''
});

// Verificar configuração no carregamento
console.log('RapidAPI Service configurado com:', {
  baseUrl: process.env.NEXT_PUBLIC_RAPIDAPI_URL,
  host: process.env.NEXT_PUBLIC_RAPIDAPI_HOST,
  hasApiKey: !!process.env.NEXT_PUBLIC_RAPIDAPI_KEY
}); 