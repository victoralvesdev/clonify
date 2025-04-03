import { NextResponse } from 'next/server';
import puppeteer, { ResourceType } from 'puppeteer';
import { mediaCache } from '@/services/mediaCache';

interface MediaElement {
  type: 'image' | 'video';
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  poster?: string;
  backgroundImage?: string | null;
}

interface ExtractedMedia {
  elements: MediaElement[];
  timestamp: string;
}

interface PuppeteerError extends Error {
  message: string;
  name: string;
  stack?: string;
}

export async function POST(request: Request) {
  let browser;
  
  try {
    const { url } = await request.json();

    if (!url) {
      return new NextResponse(JSON.stringify({
        elements: [],
        timestamp: new Date().toISOString(),
        error: 'URL não fornecida'
      }), { status: 400 });
    }

    // Verificar cache
    const cachedData = mediaCache.get(url);
    if (cachedData) {
      console.log('Usando dados em cache para:', url);
      return new NextResponse(JSON.stringify(cachedData), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    console.log('Extraindo mídia de:', url);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Configurar headers para simular um navegador real
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    // Configurar viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Habilitar console logs da página
    page.on('console', msg => console.log('Página log:', msg.text()));

    try {
      console.log('Navegando para:', url);
      
      // Navegar para a página com retry
      for (let i = 0; i < 3; i++) {
        try {
          await page.goto(url, { 
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 30000
          });
          console.log('Página carregada com sucesso');
          break;
        } catch (error: unknown) {
          const puppeteerError = error as PuppeteerError;
          console.log(`Tentativa ${i + 1} falhou:`, puppeteerError.message);
          if (i === 2) throw error;
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      // Aguardar carregamento específico para anúncios do Facebook
      if (url.includes('facebook.com/ads/library')) {
        console.log('Detectado anúncio do Facebook, aguardando elementos específicos...');
        
        try {
          await page.waitForFunction(() => {
            const adContainer = document.querySelector('div[data-ad-preview="message"]');
            const adMedia = document.querySelector('div[data-ad-preview="media"]');
            console.log('Elementos encontrados:', {
              adContainer: !!adContainer,
              adMedia: !!adMedia
            });
            return adContainer || adMedia;
          }, { timeout: 15000 });
          
          console.log('Elementos do Facebook detectados com sucesso');
          
        } catch (error: unknown) {
          const puppeteerError = error as PuppeteerError;
          console.log('Aviso: Timeout ao aguardar elementos específicos do Facebook:', puppeteerError.message);
        }
      }

      // Extrair mídia com seletores específicos para anúncios do Facebook
      console.log('Iniciando extração de mídia...');
      
      const mediaElements = await page.evaluate(() => {
        const getMediaElements = (): MediaElement[] => {
          try {
            console.log('Iniciando busca por elementos de mídia...');
            
            // Primeiro, tentar encontrar a thumbnail do anúncio
            const adPreviewMedia = document.querySelector('div[data-ad-preview="media"]');
            console.log('Preview de mídia encontrado:', !!adPreviewMedia);
            
            if (adPreviewMedia) {
              // Procurar por imagem dentro do preview
              const previewImage = adPreviewMedia.querySelector('img');
              console.log('Imagem de preview encontrada:', !!previewImage);
              
              if (previewImage) {
                const element = previewImage as HTMLImageElement;
                const computedStyle = window.getComputedStyle(element);
                
                let imageUrl = element.src || 
                              element.getAttribute('data-src') || 
                              element.getAttribute('data-original') ||
                              '';
                
                console.log('URL da imagem encontrada:', imageUrl);
                
                if (!imageUrl && computedStyle.backgroundImage) {
                  const match = computedStyle.backgroundImage.match(/url\(['"](.+?)['"]\)/);
                  if (match) imageUrl = match[1];
                  console.log('URL extraída do background-image:', imageUrl);
                }

                if (imageUrl && !imageUrl.includes('favicon') && !imageUrl.includes('logo')) {
                  return [{
                    type: 'image' as const,
                    url: imageUrl,
                    alt: element.alt,
                    width: element.width || parseInt(computedStyle.width) || 0,
                    height: element.height || parseInt(computedStyle.height) || 0
                  }];
                }
              }

              // Se não encontrou imagem, procurar por vídeo
              const previewVideo = adPreviewMedia.querySelector('video');
              console.log('Vídeo de preview encontrado:', !!previewVideo);
              
              if (previewVideo) {
                const element = previewVideo as HTMLVideoElement;
                const url = element.src || 
                           element.getAttribute('data-video-url') || 
                           element.getAttribute('data-video-source') || 
                           '';

                console.log('URL do vídeo encontrada:', url);

                if (url) {
                  return [{
                    type: 'video' as const,
                    url,
                    poster: element.poster
                  }];
                }
              }
            }

            // Se não encontrou no preview, tentar no conteúdo do anúncio
            const adContent = document.querySelector('div[data-ad-preview="message"]');
            console.log('Conteúdo do anúncio encontrado:', !!adContent);
            
            if (adContent) {
              const contentImage = adContent.querySelector('img');
              console.log('Imagem no conteúdo encontrada:', !!contentImage);
              
              if (contentImage) {
                const element = contentImage as HTMLImageElement;
                const url = element.src;
                console.log('URL da imagem do conteúdo:', url);
                
                if (url && !url.includes('favicon') && !url.includes('logo')) {
                  return [{
                    type: 'image' as const,
                    url,
                    alt: element.alt,
                    width: element.width,
                    height: element.height
                  }];
                }
              }
            }

            console.log('Nenhum elemento de mídia encontrado');
            return [];
          } catch (error) {
            console.error('Erro ao extrair elementos de mídia:', error);
            return [];
          }
        };

        return getMediaElements();
      });

      console.log('Elementos de mídia encontrados:', mediaElements);

      const extractedMedia: ExtractedMedia = {
        elements: mediaElements || [],
        timestamp: new Date().toISOString()
      };

      // Armazenar no cache
      mediaCache.set(url, extractedMedia);

      console.log('Extração concluída com sucesso');

      return new NextResponse(JSON.stringify(extractedMedia), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        }
      });

    } finally {
      if (browser) {
        await browser.close();
        console.log('Navegador fechado');
      }
    }

  } catch (error: unknown) {
    const puppeteerError = error as PuppeteerError;
    console.error('Erro ao extrair mídia:', puppeteerError);
    
    if (browser) {
      try {
        await browser.close();
        console.log('Navegador fechado após erro');
      } catch (closeError) {
        console.error('Erro ao fechar navegador:', closeError);
      }
    }
    
    // Retornar um objeto válido mesmo em caso de erro
    return new NextResponse(JSON.stringify({ 
      elements: [],
      timestamp: new Date().toISOString(),
      error: puppeteerError.message,
      stack: puppeteerError.stack
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 