import { FacebookAd } from '@/types/facebook';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface MediaElement {
  type: 'image' | 'video' | 'loading' | 'none';
  src: string;
  poster: string | null;
  error: boolean;
}

interface AdCardProps {
  ad: FacebookAd;
  onSelect?: (ad: FacebookAd) => void;
}

// Função auxiliar para formatar datas
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export function AdCard({ ad, onSelect }: AdCardProps) {
  const [media, setMedia] = useState<MediaElement>({
    type: 'loading',
    src: '',
    poster: null,
    error: false
  });
  
  // Contador de tentativas de carregamento
  const retryCount = useRef(0);
  const maxRetries = 2;
  
  // Verifica se o anúncio tem conteúdo válido para exibir
  const hasValidContent = (): boolean => {
    // Verifica se tem texto
    const hasText = Boolean(
      ad.ad_creative_bodies?.[0] || 
      ad.ad_creative_link_descriptions?.[0] ||
      ad.ad_creative_link_titles?.[0]
    );

    // Verifica se tem mídia válida
    const hasValidImage = Boolean(ad.media_type === 'image' && ad.media_urls?.image);
    const hasValidVideo = Boolean(ad.media_type === 'video' && ad.media_urls?.video);
    
    // Só retorna true se tiver texto E mídia válida
    return hasText && (hasValidImage || hasValidVideo);
  };
  
  // Se não houver conteúdo válido, não renderiza o anúncio
  if (!hasValidContent()) {
    console.log('Anúncio sem conteúdo válido:', {
      id: ad.id,
      hasText: Boolean(ad.ad_creative_bodies?.[0] || ad.ad_creative_link_descriptions?.[0]),
      mediaType: ad.media_type,
      hasImage: Boolean(ad.media_urls?.image),
      hasVideo: Boolean(ad.media_urls?.video)
    });
    return null;
  }

  useEffect(() => {
    // Reset do contador de tentativas quando muda o anúncio
    retryCount.current = 0;
    loadMedia();
  }, [ad.media_urls]);

  const loadMedia = () => {
    if (!ad.media_urls) {
      console.log('Sem URLs de mídia disponíveis');
      setMedia({
        type: 'none',
        src: '',
        poster: null,
        error: false
      });
      return;
    }

    // Log para debug
    console.log('Carregando mídia:', {
      mediaType: ad.media_type,
      imageUrl: ad.media_urls.image,
      videoUrl: ad.media_urls.video
    });

    // Se temos vídeo disponível
    if (ad.media_type === 'video' && ad.media_urls.video) {
      const videoUrl = ad.media_urls.video;
      console.log('Carregando vídeo:', videoUrl);
      setMedia({
        type: 'video',
        src: videoUrl,
        poster: ad.media_urls.image || null,
        error: false
      });
      return;
    }

    // Se temos imagem disponível
    if (ad.media_type === 'image' && ad.media_urls.image) {
      const imageUrl = ad.media_urls.image;
      console.log('Carregando imagem:', imageUrl);
      setMedia({
        type: 'image',
        src: imageUrl,
        poster: null,
        error: false
      });
      return;
    }

    // Se não temos mídia válida
    console.log('Nenhuma mídia válida encontrada');
    setMedia({
      type: 'none',
      src: '',
      poster: null,
      error: false
    });
  };

  // Função para tentar carregar uma URL alternativa quando a principal falha
  const handleMediaError = () => {
    console.log('Erro ao carregar mídia:', {
      type: media.type,
      src: media.src,
      retryCount: retryCount.current
    });
    
    // Se falhar e ainda não ultrapassou o limite de tentativas
    if (retryCount.current < maxRetries) {
      retryCount.current += 1;
      console.log(`Tentativa ${retryCount.current} de ${maxRetries}`);
      
      // Espera um pouco antes de tentar novamente
      setTimeout(loadMedia, 1000);
    } else {
      console.log("Todas as tentativas falharam, removendo anúncio:", ad.id);
      // Em vez de mostrar erro, simplesmente não renderiza o componente
      setMedia({
        type: 'none',
        src: '',
        poster: null,
        error: true
      });
    }
  };

  // Se a mídia falhou definitivamente após todas as tentativas, não renderiza
  if (media.error) {
    return null;
  }

  // Verifica se o texto HTML contém uma URL de imagem ou vídeo
  const extractMediaUrl = (htmlContent?: string): string | null => {
    if (!htmlContent) return null;
    
    // Regex para encontrar URLs de imagem ou vídeo em conteúdo HTML
    const mediaRegex = /(https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|gif|mp4|webm))/i;
    const match = htmlContent.match(mediaRegex);
    
    return match ? match[0] : null;
  };

  // Extrai o texto mais relevante para mostrar como descrição
  const getDescriptionText = (): string => {
    if (ad.ad_creative_bodies?.[0]) {
      return ad.ad_creative_bodies[0].replace(/<[^>]*>/g, ' ').trim();
    }
    if (ad.ad_creative_link_descriptions?.[0]) {
      return ad.ad_creative_link_descriptions[0];
    }
    return 'Sem descrição disponível';
  };

  // Verificar se o corpo do anúncio contém uma URL de mídia que podemos usar como fallback
  const fallbackMediaUrl = extractMediaUrl(ad.ad_creative_bodies?.[0]);

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden glass-effect transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
      <div className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-medium text-white">{ad.page_name || 'Página Desconhecida'}</h3>
            <div className="text-xs text-gray-300 mt-1">
              <p>ID: <span className="font-mono bg-[#525196]/30 px-1 rounded">{ad.id}</span></p>
              <p>ArchiveID: <span className="font-mono bg-[#525196]/30 px-1 rounded">{ad.ad_archive_id}</span></p>
              {ad.active_ads_count && (
                <p><span className="font-mono bg-green-500/30 text-green-200 px-1 rounded">
                  {ad.active_ads_count} {ad.active_ads_count === 1 ? 'anúncio ativo' : 'anúncios ativos'}
                </span></p>
              )}
            </div>
          </div>
          <div className="flex space-x-1">
            {ad.publisher_platforms?.map((platform, index) => (
              <span key={index} className="text-xs px-2 py-1 rounded-full bg-[#525196]/30 text-white">
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="h-90 relative overflow-hidden bg-[#525196]/20">
        {media.type === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        
        {media.type === 'image' && !media.error && media.src && (
          <div className="w-full h-full relative">
            <img
              src={media.src}
              alt={ad.ad_creative_link_titles?.[0] || 'Anúncio'}
              className="object-cover w-full h-full"
              onError={handleMediaError}
              loading="lazy"
            />
          </div>
        )}
        
        {media.type === 'video' && !media.error && media.src && (
          <div className="w-full h-full relative">
            <video 
              src={media.src}
              poster={media.poster || undefined}
              controls
              className="object-cover w-full h-full"
              onError={handleMediaError}
              preload="metadata"
            />
          </div>
        )}
        
        {(media.error || media.type === 'none') && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 p-4 text-center">
            {fallbackMediaUrl ? (
              <img 
                src={fallbackMediaUrl}
                alt="Mídia alternativa"
                className="object-cover w-full h-full"
                onError={() => console.log("Fallback também falhou")}
              />
            ) : (
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Mídia não disponível</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex-grow flex flex-col p-4 pt-3">
        {ad.ad_creative_link_titles?.[0] && (
          <div className="mb-2">
            <h3 className="font-semibold text-sm text-white">{ad.ad_creative_link_titles[0]}</h3>
          </div>
        )}
        
        <div className="mb-3">
          <p className="text-sm text-gray-200 line-clamp-3">
            {getDescriptionText()}
          </p>
        </div>
        
        <div className="text-xs text-gray-300 mt-auto space-y-1">
          <div className="flex justify-between">
            <span>Início: {formatDate(ad.ad_delivery_start_time)}</span>
            {ad.ad_delivery_stop_time && (
              <span>Fim: {formatDate(ad.ad_delivery_stop_time)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 pt-0 space-y-2">
        <a 
          href={ad.ad_snapshot_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-[#525196] hover:bg-[#525196]/80 rounded-md transition-colors"
        >
          Ver na Biblioteca de Anúncios
        </a>
        {ad.link_url && (
          <a 
            href={ad.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            Ver Página de Vendas
          </a>
        )}
      </div>
    </div>
  );
}

export default AdCard; 