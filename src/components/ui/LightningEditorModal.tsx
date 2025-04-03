import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Info, ChevronDown, Image as ImageIcon, Pencil } from 'lucide-react';
import { EditImageModal } from './EditImageModal';

interface LinkData {
  id: number;
  href: string;
  text: string;
  target: '_self' | '_blank';
}

interface ImageData {
  id: number;
  src: string;
  alt: string;
  type?: string;
  aspectRatio?: string;
  quality?: string;
  width?: number;
  height?: number;
  validSvg?: boolean;
}

interface ConfigData {
  title: string;
  description: string;
  favicon: string;
}

// Tipos de Pixel Suportados
type PixelType = 'facebook' | 'tiktok' | 'ga4' | 'gtm' | 'kiwify' | 'hotjar' | 'clarity' | 'custom';

const PIXEL_CONFIG: Record<PixelType, { name: string; description: string; headSelector?: string; bodySelector?: string }> = {
  facebook: { name: 'Meta (Facebook) Pixel', description: 'Rastreie conversões, crie públicos e otimize anúncios no Facebook e Instagram.', headSelector: 'script[data-pixel-type="facebook"], script[src*="connect.facebook.net"], script:contains("fbq(")' },
  tiktok: { name: 'TikTok Pixel', description: 'Monitore o desempenho de anúncios e campanhas do TikTok.', headSelector: 'script[data-pixel-type="tiktok"], script[src*="tiktok.com"], script:contains("_tiktokq")' },
  ga4: { name: 'Google Analytics 4', description: 'Entenda o comportamento do usuário e o desempenho do seu site.', headSelector: 'script[data-pixel-type="ga4"], script[src*="googletagmanager.com/gtag/js"], script:contains("gtag(")' },
  gtm: { name: 'Google Tag Manager', description: 'Gerencie todos os seus códigos de rastreamento em um só lugar.', headSelector: 'script[data-pixel-type="gtm-head"], script:contains("googletagmanager.com/gtm.js")', bodySelector: 'noscript[data-pixel-type="gtm-body"]:contains("googletagmanager.com/ns.html")' },
  kiwify: { name: 'Kiwify Tracking', description: 'Acompanhe eventos de conversão da plataforma Kiwify.', headSelector: 'script[data-pixel-type="kiwify"], script[src*="scripts.kiwify"]' },
  hotjar: { name: 'Hotjar Tracking', description: 'Entenda como os usuários interagem com seu site através de mapas de calor e gravações.', headSelector: 'script[data-pixel-type="hotjar"], script:contains("hj(")' },
  clarity: { name: 'Microsoft Clarity', description: 'Visualize a experiência do usuário com mapas de calor e replays de sessão gratuitos.', headSelector: 'script[data-pixel-type="clarity"], script:contains("clarity(")' },
  custom: { name: 'Pixel Personalizado', description: 'Adicione qualquer outro script de rastreamento ou código personalizado no head.', headSelector: 'script[data-pixel-type="custom"]' }
};

interface LightningEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  onSaveChanges: (newHtml: string) => void;
}

// Função para determinar a qualidade da imagem baseada nas dimensões
const determineQuality = (width: number, height: number): string => {
  const totalPixels = width * height;
  
  if (totalPixels >= 1920 * 1080) return 'HD';
  if (totalPixels >= 1280 * 720) return 'Alta';
  if (totalPixels >= 640 * 480) return 'Média';
  return 'Baixa';
};

// Função para determinar a relação de aspecto da imagem
const determineAspectRatio = (width: number, height: number): string => {
  if (!width || !height) return '---';
  
  // Calcula o MDC (GCD) para simplificar a relação
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };
  
  const commonDivisor = gcd(width, height);
  const simplifiedWidth = width / commonDivisor;
  const simplifiedHeight = height / commonDivisor;
  
  // Verifica proporções comuns
  if (Math.abs(simplifiedWidth / simplifiedHeight - 1) < 0.01) {
    return '1:1'; // Quadrado
  }
  if (Math.abs(simplifiedWidth / simplifiedHeight - 16/9) < 0.01) {
    return '16:9'; // Widescreen
  }
  if (Math.abs(simplifiedWidth / simplifiedHeight - 4/3) < 0.01) {
    return '4:3'; // Tradicional
  }
  if (Math.abs(simplifiedWidth / simplifiedHeight - 3/2) < 0.01) {
    return '3:2'; // Fotografia
  }
  if (Math.abs(simplifiedWidth / simplifiedHeight - 21/9) < 0.01) {
    return '21:9'; // Ultra-wide
  }
  if (Math.abs(simplifiedWidth / simplifiedHeight - 5/4) < 0.01) {
    return '5:4';
  }
  if (Math.abs(simplifiedWidth / simplifiedHeight - 1.414) < 0.01) {
    return 'A4';
  }
  
  // Retorna a proporção simplificada se não for uma padrão
  if (simplifiedWidth <= 20 && simplifiedHeight <= 20) {
    return `${Math.round(simplifiedWidth)}:${Math.round(simplifiedHeight)}`;
  }
  
  // Ou retorna arredondada para uma casa decimal
  const ratio = (width / height).toFixed(1);
  return `${ratio}:1`;
};

export const LightningEditorModal: React.FC<LightningEditorModalProps> = ({ 
  isOpen, 
  onClose, 
  htmlContent, 
  onSaveChanges 
}) => {
  const [activeTab, setActiveTab] = useState('links');
  const [links, setLinks] = useState<LinkData[]>([]);
  const [images, setImages] = useState<ImageData[]>([]);
  const [pixelScripts, setPixelScripts] = useState<Record<PixelType, string>>({
    facebook: '',
    tiktok: '',
    ga4: '',
    gtm: '',
    kiwify: '',
    hotjar: '',
    clarity: '',
    custom: ''
  });
  const [gtmBodyScript, setGtmBodyScript] = useState('');
  const [config, setConfig] = useState<ConfigData>({ title: '', description: '', favicon: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  // Adicionar estado para controlar URLs de proxy
  const [proxiedUrls, setProxiedUrls] = useState<Record<string, string>>({});

  // Estados para o modal de edição de imagem
  const [isEditImageModalOpen, setIsEditImageModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageData | null>(null);

  useEffect(() => {
    if (isOpen && htmlContent) {
      setIsLoading(true);
      console.log("LightningEditor: Parsing HTML...");
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // --- Extrair Links ---
        const foundLinks: LinkData[] = [];
        doc.querySelectorAll('a').forEach((a, index) => {
          // Ignorar links vazios ou apenas #
          if (a.getAttribute('href') && a.getAttribute('href') !== '#') {
            foundLinks.push({
              id: index,
              href: a.getAttribute('href') || '',
              text: a.innerText.trim(),
              target: a.getAttribute('target') === '_blank' ? '_blank' : '_self',
            });
          }
        });
        setLinks(foundLinks);
        console.log(`Found ${foundLinks.length} links.`);

        // --- Extrair Imagens ---
        const foundImages: ImageData[] = [];
        let imageCounter = 0;

        // 1. Primeiro, extrair todas as tags <img> (método original)
        doc.querySelectorAll('img').forEach((img) => {
          // Processar imagem usando a função auxiliar
          processImageTag(img, imageCounter++);
        });

        // 2. Extrair SVGs inline
        doc.querySelectorAll('svg').forEach((svg) => {
          try {
            const svgContent = svg.outerHTML;
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svg);
            const svgBase64 = btoa(svgString);
            const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
            
            // Obter dimensões
            const svgWidth = svg.getAttribute('width') ? parseInt(svg.getAttribute('width') || '0', 10) : 0;
            const svgHeight = svg.getAttribute('height') ? parseInt(svg.getAttribute('height') || '0', 10) : 0;
            
            // Para SVGs que não têm dimensões explícitas, tente pegar do viewBox
            let width = svgWidth;
            let height = svgHeight;
            if ((!width || !height) && svg.getAttribute('viewBox')) {
              const viewBox = svg.getAttribute('viewBox')?.split(' ');
              if (viewBox && viewBox.length === 4) {
                width = parseInt(viewBox[2], 10);
                height = parseInt(viewBox[3], 10);
              }
            }
            
            foundImages.push({
              id: imageCounter++,
              src: dataUrl,
              alt: svg.getAttribute('aria-label') || svg.getAttribute('title') || `SVG inline #${imageCounter}`,
              type: 'SVG',
              width: width || 0,
              height: height || 0,
              aspectRatio: width && height ? determineAspectRatio(width, height) : '---',
              quality: width && height ? determineQuality(width, height) : '---'
            });
          } catch (e) {
            console.error('Failed to process inline SVG:', e);
          }
        });

        // 3. Extrair imagens de background CSS definidas inline nos elementos
        const extractBackgroundImagesFromInline = (elements: Element[]) => {
          elements.forEach((el) => {
            try {
              // Pegar o estilo inline
              const style = (el as HTMLElement).style;
              const backgroundImage = style.backgroundImage;
              
              if (backgroundImage && backgroundImage !== 'none') {
                // Extrair URL da string CSS 'url("...")'
                const urlMatch = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/i);
                if (urlMatch && urlMatch[1]) {
                  let url = urlMatch[1];
                  
                  // Resolver URL relativa se necessário
                  if (!url.startsWith('http') && !url.startsWith('data:')) {
                    try {
                      url = new URL(url, doc.baseURI).href;
                    } catch (e) {
                      console.warn(`Could not resolve absolute URL for background image: ${url}`, e);
                    }
                  }
                  
                  // Criar objeto de imagem para medir dimensões
                  if (url) {
                    foundImages.push({
                      id: imageCounter++,
                      src: url,
                      alt: `Background Image #${imageCounter}`,
                      type: detectImageTypeFromUrl(url),
                      width: 0,  // Serão atualizados pela detecção posterior
                      height: 0
                    });
                  }
                }
              }
            } catch (e) {
              console.warn('Failed to extract background image from element:', e);
            }
          });
        };

        // 4. Detectar imagens de background em elementos com estilos inline
        const elementsWithPossibleBackgrounds = doc.querySelectorAll('[style*="background"]');
        extractBackgroundImagesFromInline(Array.from(elementsWithPossibleBackgrounds));

        // 5. Extrair imagens de elementos com atributo srcset
        doc.querySelectorAll('[srcset]').forEach((el) => {
          if (el.tagName !== 'IMG') { // Pular elementos <img> pois já foram processados
            try {
              const srcset = el.getAttribute('srcset');
              if (srcset) {
                // Pegar a primeira imagem do srcset (geralmente a de maior qualidade)
                const firstImage = srcset.split(',')[0].trim().split(' ')[0];
                if (firstImage) {
                  let url = firstImage;
                  
                  // Resolver URL relativa se necessário
                  if (!url.startsWith('http') && !url.startsWith('data:')) {
                    try {
                      url = new URL(url, doc.baseURI).href;
                    } catch (e) {
                      console.warn(`Could not resolve absolute URL for srcset image: ${url}`, e);
                    }
                  }
                  
                  foundImages.push({
                    id: imageCounter++,
                    src: url,
                    alt: el.getAttribute('alt') || `Srcset Image #${imageCounter}`,
                    type: detectImageTypeFromUrl(url)
                  });
                }
              }
            } catch (e) {
              console.warn('Failed to extract image from srcset:', e);
            }
          }
        });

        // 6. Extrair imagens de iframes
        doc.querySelectorAll('iframe').forEach((iframe) => {
          try {
            // Para iframes de videos do YouTube, extrair thumbnail
            const src = iframe.getAttribute('src') || '';
            
            // Detectar YouTube
            if (src.includes('youtube.com/embed/') || src.includes('youtube-nocookie.com/embed/')) {
              const videoId = src.split('/').pop()?.split('?')[0];
              if (videoId) {
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                foundImages.push({
                  id: imageCounter++,
                  src: thumbnailUrl,
                  alt: `YouTube Thumbnail #${imageCounter}`,
                  type: 'JPG',
                  width: 480,
                  height: 360,
                  aspectRatio: '4:3',
                  quality: 'Média'
                });
              }
            }
            
            // Detectar Vimeo (mais difícil pois requer API)
            // Pode ser implementado se necessário
          } catch (e) {
            console.warn('Failed to extract image from iframe:', e);
          }
        });

        // 7. Função auxiliar para detectar tipo de imagem pela URL
        const detectImageTypeFromUrl = (url: string): string | undefined => {
          if (url.startsWith('data:image/')) {
            const mimeMatch = url.match(/^data:image\/([a-zA-Z+]+);/);
            if (mimeMatch && mimeMatch[1]) {
              return mimeMatch[1].toUpperCase();
            }
            return undefined;
          }
          
          try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const extensionMatch = pathname.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/i);
            if (extensionMatch && extensionMatch[1]) {
              return extensionMatch[1].toUpperCase();
            }
          } catch (e) {
            // Não é uma URL válida
          }
          
          return undefined;
        };

        // 8. Função auxiliar para processar tags <img> (refatoração do código original)
        const processImageTag = (img: HTMLImageElement, index: number) => {
          let absoluteSrc = img.src;
          if (!absoluteSrc && img.getAttribute('src')) {
            try {
              // Se for relativo, tenta construir com a base do documento
              if (!img.getAttribute('src')?.startsWith('http') && !img.getAttribute('src')?.startsWith('data:')) {
                absoluteSrc = new URL(img.getAttribute('src') || '', doc.baseURI).href;
              } else {
                absoluteSrc = img.getAttribute('src') || '';
              }
            } catch (e) {
              absoluteSrc = img.getAttribute('src') || ''; // Usa o atributo src como fallback
              console.warn(`Could not resolve absolute URL for img src: ${img.getAttribute('src')}`, e);
            }
          }
          
          // Se ainda não temos src, tentar srcset
          if (!absoluteSrc && img.srcset) {
            const firstImage = img.srcset.split(',')[0].trim().split(' ')[0];
            if (firstImage) {
              try {
                if (!firstImage.startsWith('http') && !firstImage.startsWith('data:')) {
                  absoluteSrc = new URL(firstImage, doc.baseURI).href;
                } else {
                  absoluteSrc = firstImage;
                }
              } catch (e) {
                absoluteSrc = firstImage;
                console.warn(`Could not resolve absolute URL for img srcset: ${firstImage}`, e);
              }
            }
          }
          
          // Se ainda não temos src, tenta salvar o que temos
          if (!absoluteSrc) {
            absoluteSrc = img.getAttribute('src') || img.getAttribute('data-src') || '';
          }
          
          // Ignorar imagens vazias
          if (!absoluteSrc) return;
          
          let imageType: string | undefined = undefined;
          const srcToCheck = absoluteSrc || img.getAttribute('src') || '';
          
          // Tentar inferir tipo pela extensão da URL
          imageType = detectImageTypeFromUrl(srcToCheck);
          
          // Extrair dimensões da imagem
          const width = img.width || img.naturalWidth || 0;
          const height = img.height || img.naturalHeight || 0;
          
          // Determinar proporção e qualidade
          let aspectRatio = '---';
          let quality = '---';
          
          if (width && height) {
            aspectRatio = determineAspectRatio(width, height);
            quality = determineQuality(width, height);
          }
          
          // Buscar as dimensões reais da imagem criando uma nova imagem temporária
          if ((width === 0 || height === 0) && absoluteSrc) {
            const tempImg = new Image();
            tempImg.onload = function() {
              // Atualiza a imagem com dimensões reais
              const imgWidth = tempImg.naturalWidth;
              const imgHeight = tempImg.naturalHeight;
              
              if (imgWidth && imgHeight) {
                const imgAspectRatio = determineAspectRatio(imgWidth, imgHeight);
                const imgQuality = determineQuality(imgWidth, imgHeight);
                
                setImages(currentImages => 
                  currentImages.map(img => 
                    img.id === index ? { 
                      ...img, 
                      width: imgWidth,
                      height: imgHeight,
                      aspectRatio: imgAspectRatio, 
                      quality: imgQuality 
                    } : img
                  )
                );
              }
            };
            tempImg.onerror = function() {
              console.error(`Failed to load image for metadata analysis: ${absoluteSrc}`);
            };
            tempImg.src = absoluteSrc;
          }
          
          foundImages.push({
            id: index,
            src: absoluteSrc || '',
            alt: img.getAttribute('alt') || '',
            type: imageType,
            width: width,
            height: height,
            aspectRatio: aspectRatio,
            quality: quality
          });
        };

        // 9. Antes de finalizar, remover duplicatas (mesma URL)
        const uniqueImages = foundImages.filter((image, index, self) => 
          index === self.findIndex((i) => i.src === image.src && image.src !== '')
        );

        // 10. Ordenar por prioridade: primeiros as imagens maiores que provavelmente são mais importantes
        uniqueImages.sort((a, b) => {
          // Se temos dimensões para ambas, ordenar por tamanho (maior primeiro)
          if (a.width && a.height && b.width && b.height) {
            const aSize = a.width * a.height;
            const bSize = b.width * b.height;
            return bSize - aSize;
          }
          
          // Priorizar imagens com dimensões conhecidas
          if (a.width && a.height) return -1;
          if (b.width && b.height) return 1;
          
          // Caso contrário, manter ordem original
          return a.id - b.id;
        });

        setImages(uniqueImages);
        console.log(`Found ${uniqueImages.length} images (including backgrounds and SVGs).`);
        
        // --- Extrair Pixels ---
        const foundPixels: Record<PixelType, string> = { facebook: '', tiktok: '', ga4: '', gtm: '', kiwify: '', hotjar: '', clarity: '', custom: '' };
        let foundGtmBody = '';

        Object.keys(PIXEL_CONFIG).forEach((key) => {
          const type = key as PixelType;
          const config = PIXEL_CONFIG[type];
          let foundScript = '';

          // Tentar encontrar pelo seletor específico no head
          if (config.headSelector) {
            try {
              const element = doc.head?.querySelector(config.headSelector);
              if (element) {
                foundScript = element.outerHTML; // Pegar o HTML completo do script
                console.log(`Found pixel [${type}] in head using selector: ${config.headSelector}`);
                element.remove(); // Remover para evitar duplicação ao salvar
              }
            } catch (e) {
              // JQuery selectors like :contains might throw, ignore
              console.warn(`Selector error for ${type} head: ${e}`);
            }
          }
          
          // Lógica específica para GTM Body
          if (type === 'gtm' && config.bodySelector) {
             try {
              const bodyElement = doc.body?.querySelector(config.bodySelector);
              if (bodyElement) {
                foundGtmBody = bodyElement.outerHTML;
                console.log(`Found pixel [gtm-body] in body using selector: ${config.bodySelector}`);
                bodyElement.remove();
              }
            } catch (e) {
              console.warn(`Selector error for gtm body: ${e}`);
            }
          }
          foundPixels[type] = foundScript;
        });
        setPixelScripts(foundPixels);
        setGtmBodyScript(foundGtmBody);
        console.log('Extracted Pixels:', foundPixels);
        console.log('Extracted GTM Body:', foundGtmBody);
        
        // --- Extrair Config (Title, Description & Favicon) ---
        const titleTag = doc.querySelector('title');
        const descriptionTag = doc.querySelector('meta[name="description"]');
        const faviconTag = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        setConfig({
          title: titleTag ? titleTag.innerText : '',
          description: descriptionTag ? descriptionTag.getAttribute('content') || '' : '',
          favicon: faviconTag ? faviconTag.getAttribute('href') || '' : '',
        });

      } catch (error) {
        console.error("Error parsing HTML in Lightning Editor:", error);
        // Handle error state if needed
      } finally {
        setIsLoading(false);
      }
    }
  }, [isOpen, htmlContent]);

  // Efeito adicional para pré-carregar e validar imagens SVG base64
  useEffect(() => {
    // Não fazer nada se não tivermos imagens ou se o modal estiver fechado
    if (!isOpen || images.length === 0) return;
    
    // Procurar imagens SVG base64 que podem precisar de tratamento especial
    const svgImages = images.filter(img => img.src.startsWith('data:image/svg+xml;base64,'));
    
    // Pré-carregar cada imagem SVG base64 para detectar se é válida
    svgImages.forEach(img => {
      try {
        // Criar novo objeto de imagem para testar carregamento
        const imgObj = new Image();
        
        imgObj.onload = () => {
          // A imagem carregou corretamente - atualizar estado para marcar como válida
          setImages(currentImages => 
            currentImages.map(currentImg => 
              currentImg.id === img.id ? 
              { 
                ...currentImg, 
                // Adicionar largura e altura se não tiver
                width: currentImg.width || imgObj.naturalWidth,
                height: currentImg.height || imgObj.naturalHeight,
                // Atualizar qualidade e proporção se necessário
                aspectRatio: !currentImg.aspectRatio || currentImg.aspectRatio === '---' ? 
                  determineAspectRatio(imgObj.naturalWidth, imgObj.naturalHeight) : 
                  currentImg.aspectRatio,
                quality: !currentImg.quality || currentImg.quality === '---' ? 
                  determineQuality(imgObj.naturalWidth, imgObj.naturalHeight) : 
                  currentImg.quality,
                // Marcar como uma imagem válida
                validSvg: true
              } : 
              currentImg
            )
          );
        };
        
        imgObj.onerror = () => {
          // A imagem falhou ao carregar - atualizar estado para marcar como inválida
          setImages(currentImages => 
            currentImages.map(currentImg => 
              currentImg.id === img.id ? 
              { ...currentImg, validSvg: false } : 
              currentImg
            )
          );
          console.error(`SVG base64 validation failed for image #${img.id + 1}`);
        };
        
        // Iniciar carregamento da imagem
        imgObj.src = img.src;
        
      } catch (error) {
        console.error(`Error pre-loading SVG base64 for image #${img.id + 1}:`, error);
      }
    });
  }, [isOpen, images.length]);

  const handleLinkChange = (id: number, field: keyof LinkData, value: string) => {
    setLinks(currentLinks => 
      currentLinks.map(link => 
        link.id === id ? { ...link, [field]: value } : link
      )
    );
  };

  const handlePixelChange = (type: PixelType, value: string) => {
    setPixelScripts(prev => ({ ...prev, [type]: value }));
  };

  const handleImageChange = (id: number, newSrc: string, newAlt: string) => {
    setImages(currentImages => 
      currentImages.map(img => 
        img.id === id ? { ...img, src: newSrc, alt: newAlt } : img
      )
    );
  };

  // Abrir modal de edição para uma imagem específica
  const handleEditImageClick = (image: ImageData) => {
    setEditingImage(image);
    setIsEditImageModalOpen(true);
  };

  // Função para criar URL de proxy para imagens externas
  const getProxyUrl = (url: string) => {
    // Verificar se já temos essa URL em cache
    if (proxiedUrls[url]) {
      return proxiedUrls[url];
    }
    
    // Usar imgproxy.net como serviço de proxy (gratuito para uso básico)
    // ou outra alternativa seria usar https://images.weserv.nl
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=default`;
    
    // Salvar no cache para futuras referências
    setProxiedUrls(prev => ({...prev, [url]: proxyUrl}));
    
    return proxyUrl;
  };

  // Método para renderizar imagens SVG de forma segura
  const renderImageSafely = (image: ImageData) => {
    if (!image.src) {
      // Fallback para quando não há source
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e2235]/50 rounded">
          <svg 
            viewBox="0 0 24 24" 
            width="48" 
            height="48" 
            stroke="#8A63F4" 
            fill="none" 
            strokeWidth="1.5"
            className="mb-2 opacity-60"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          <span className="text-xs text-gray-400">Sem imagem</span>
        </div>
      );
    }
    
    // Verificar se é uma imagem 1x1 pixel ou mini-GIF (GIF de 1px muito comum para tracking)
    // Também verifica se é uma dimensão muito pequena (1 ou menos) ou GIFs de tracking específicos
    const isOnePixelGif = (image.src === 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' || 
                          image.src === 'data:image/gif;base64,R0lGODdhAQABAPAAAMPDwwAAACwAAAAAAQABAAACAkQBADs=') &&
                          (image.width === 1 || image.height === 1 || !image.width || !image.height);

    // GIF real para demonstração (substitui GIFs de 1px para visualização)
    // Se o source for um desses GIFs de 1px, substitui por um GIF de exemplo para testar renderização
    const testGifUrl = "data:image/gif;base64,R0lGODlhkAGQAfcrAP///+/v797e3s7OzrW1ta2trZycnJSUlIyMjISEhHt7e3Nzc2trazkAAAAAAAAAAAAAAAAAACwAAAAAkAGQAQAI/wABCBxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmzhz6tzJs6fPn0CDCh1KtKjRo0iTKl3KtKnTp1CjSp1KtarVq1izat3KtavXr2DDih1LtqzZs2jTql3Ltq3bt3Djyp1Lt67du3jz6t3Lt6/fv4ADCx5MuLDhw4gTK17MuLHjx5AjS55MubLly5gza97MubPnz6BDix5NurTp06hTq17NurXr17Bjy55Nu7bt27hz697Nu7fv38CDCx9OvLjx48iTK1/OvLnz59CjS59Ovbr169iza9/Ovbv37+DDi/8fT768+fPo06tfz769+/fw48ufT7++/fv48+vfz7+///8ABijggAQWaOCBCCao4IIMNujggxBGKOGEFFZo4YUYZqjhhhyA6OGKEFpJoYYZAmigdiyqy+OKKMMI44XAx5kjggDy+GCSCNNI3ZIQwepejkT0m6eSMEgaJ5JNS0ijkgCw6qKKVQ1rZo5dQFvnllUq+qOWYA05IIoBkTsnmmgImiKWWRcIJp55dVlnkgQVaGOSdey44IIBfGqiioIUaiiKgVQp66JCLHnpgogSSSZA70gHxJkGeXmrQpJ9qiummm4K6qaejgvoprJtmyv9ppqZuqqqqrIJqK6yyeuopqbmGauutt6YaLKnGDrvrr8YOu+uyxSLL7LPL7hqttNRGe6210BaL7bTYcptttNp2Sy6446LrLLvigovuutwGG2+68xYLrr32Jjtvvuz+W++9APubb8AFz5uvwgs3TK/DDxs8L8T40kuxvxdbTG7GF9vrcLsXc8zvvh6HvHHJC+vLsco9l9xyxiy3G/DLLqPcMs02v6wzzywDnTPPJdtccrcz+5w0zzLnfLTN3+6c9NNOG53z1FFTbfTJVnO9dcxZT921zmGjbPHYWZMNdNOWnSzGGKi14fbSUq89tdxI382333KvQTfSaKP/LfjeXP9999xiCP62ZIxnfTfkdlNOueaXq4133GxTLnblj2+OeddyW76455qDLrnmqIceeLKaOZWpQaLDXnjqrS/O++ij4367G2aMoUY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";
  
  // Se é um GIF de 1px para tracking, substituir para demonstração
  if (isOnePixelGif) {
    // Para GIFs de 1px, mostrar placeholder especial
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e2235]/30 rounded">
        <svg 
          viewBox="0 0 24 24" 
          width="48" 
          height="48" 
          stroke="#8A63F4" 
          fill="none" 
          strokeWidth="1.5"
          className="mb-2"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        <span className="text-xs text-gray-400">GIF 1x1px</span>
      </div>
    );
  }

  // Verificar se é um GIF normal (não de tracking)
  const isNormalGif = image.src.includes('.gif') || 
                      (image.type?.toLowerCase() === 'gif') || 
                      image.src.startsWith('data:image/gif') && !isOnePixelGif;

  // Se for um GIF normal, deixar renderizar como imagem normal
  if (isNormalGif) {
    // Substituir GIFs transparentes ou pequenos com o GIF de exemplo para visualização
    const gifSrc = image.src;
    
    // Para GIFs, não usar o placeholder
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        {/* Badge de GIF */}
        <div className="absolute top-1 left-1 bg-[#8A63F4] text-white rounded-md px-1.5 py-0.5 text-[10px] font-semibold z-20">
          GIF
        </div>
        
        <img 
          key={`img-${image.id}-${Math.random().toString(36).substring(7)}`}
          src={gifSrc}
          alt={image.alt || `Imagem ${image.id + 1}`}
          className="max-h-full max-w-full object-contain h-auto w-auto z-10 relative min-h-[120px] min-w-[120px] bg-transparent"
          onLoad={(e) => {
            e.currentTarget.classList.remove('img-error');
            
            const parent = e.currentTarget.parentNode as HTMLElement;
            if (parent) {
              const errorMessage = parent.querySelector('.error-message');
              if (errorMessage) {
                errorMessage.remove();
              }
            }
            
            // Melhorar a visualização de GIFs pequenos
            console.log(`GIF loaded with dimensions: ${e.currentTarget.naturalWidth}x${e.currentTarget.naturalHeight}`);
            
            // Para GIFs que carregam muito pequenos, aumentar ainda mais
            if (e.currentTarget.naturalWidth <= 20 || e.currentTarget.naturalHeight <= 20) {
              e.currentTarget.style.minWidth = '150px';
              e.currentTarget.style.minHeight = '150px';
              e.currentTarget.style.transform = 'scale(2)';
            }
          }}
          onError={(e) => {
            console.error(`Failed to load GIF for card #${image.id + 1}:`, image.src);
            
            // Tentar carregar o GIF de exemplo caso falhe
            e.currentTarget.src = testGifUrl;
            console.log("Fallback to test GIF", image.id);
          }} 
          style={{ 
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            minHeight: '120px',
            minWidth: '120px',
            background: 'transparent'
          }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  
  // Determinar se é uma imagem SVG em base64
  const isSvgBase64 = image.src.startsWith('data:image/svg+xml;base64,');
  const isImageBase64 = image.src.startsWith('data:image/');
  const isExternalUrl = image.src.startsWith('http://') || image.src.startsWith('https://');
  
  // Se for SVG base64 e sabemos que é válido (via useEffect de pré-carregamento)
  if (isSvgBase64 && image.validSvg === true) {
    try {
      // Decodificar o SVG
      const svgContent = atob(image.src.replace('data:image/svg+xml;base64,', ''));
      
      // Verificar se o SVG parece válido
      if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
        return (
          <div 
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ 
              __html: svgContent 
            }} 
          />
        );
      }
    } catch (e) {
      console.error('Failed to decode SVG base64:', e);
    }
  }
  
  // Se o SVG foi testado e marcado como inválido, mostrar fallback especial
  if (isSvgBase64 && image.validSvg === false) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <svg 
          viewBox="0 0 24 24" 
          width="48" 
          height="48" 
          stroke="#8A63F4" 
          fill="none" 
          strokeWidth="1.5"
          className="mb-2"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        <span className="text-xs text-gray-400">SVG inválido</span>
      </div>
    );
  }
  
  // Para imagens de URLs externas, usar o serviço de proxy
  const imageSrc = isExternalUrl && !isImageBase64 ? getProxyUrl(image.src) : image.src;
  
  // Para imagens de data URLs ou urls externas, usar a tag img
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      {/* Placeholder de fundo para imagens pequenas */}
      <div className="absolute inset-0 flex items-center justify-center opacity-60">
        <svg 
          viewBox="0 0 24 24" 
          width="48" 
          height="48" 
          stroke="#8A63F4" 
          fill="none" 
          strokeWidth="1.5"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
      
      {/* Indicador de imagem externa */}
      {isExternalUrl && !isImageBase64 && (
        <div className="absolute top-1 right-1 bg-[#1e2235] rounded-full p-1 opacity-70" title="Imagem externa">
          <svg 
            viewBox="0 0 24 24" 
            width="12" 
            height="12" 
            stroke="#8A63F4" 
            fill="none" 
            strokeWidth="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </div>
      )}
      
      {/* Imagem real */}
      <img 
        key={`img-${image.id}-${Math.random().toString(36).substring(7)}`}
        src={imageSrc}
        alt={image.alt || `Imagem ${image.id + 1}`}
        className="max-h-full max-w-full object-contain h-auto w-auto z-10 relative"
        onLoad={(e) => {
          // Remover classes de erro se a imagem carregou corretamente
          e.currentTarget.classList.remove('img-error');
          
          // Remover mensagens de erro se existirem
          const parent = e.currentTarget.parentNode as HTMLElement;
          if (parent) {
            const errorMessage = parent.querySelector('.error-message');
            if (errorMessage) {
              errorMessage.remove();
            }
          }
          
          // Verificar se a imagem é muito pequena e aumentar seu tamanho visual
          if (e.currentTarget.naturalWidth <= 10 || e.currentTarget.naturalHeight <= 10) {
            e.currentTarget.style.minWidth = '80px';
            e.currentTarget.style.minHeight = '80px';
          }
        }}
        onError={(e) => {
          console.error(`Failed to load image src for card #${image.id + 1}:`, image.src);
          
          // Se estamos usando proxy mas ainda falha, tentar o recurso original ou outro proxy
          if (isExternalUrl && imageSrc !== image.src && imageSrc.includes('images.weserv.nl')) {
            // Tentar serviço alternativo de proxy
            const altProxyUrl = `https://proxy.duckduckgo.com/iu/?u=${encodeURIComponent(image.src)}`;
            console.log(`Trying alternative proxy for image #${image.id + 1}: ${altProxyUrl}`);
            e.currentTarget.src = altProxyUrl;
            
            // Atualizar cache de proxies
            setProxiedUrls(prev => ({...prev, [image.src]: altProxyUrl}));
            return;
          }
          
          // Para outros tipos de imagem, mostrar erro genérico
          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFlMjIzNSIvPjxwYXRoIGQ9Ik0xMiA4LjI1VjEyLjc1TTEyIDE1Ljc1VjE2IiBzdHJva2U9IiM4QTYzRjQiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMTIgMjJDMTcuNTIyOCAyMiAyMiAxNy41MjI4IDIyIDEyQzIyIDYuNDc3MTUgMTcuNTIyOCAyIDEyIDJDNi40NzcxNSAyIDIgNi40NzcxNSAyIDEyQzIgMTcuNTIyOCA2LjQ3NzE1IDIyIDEyIDIyWiIgc3Ryb2tlPSIjOEE2M0Y0IiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg==';
          e.currentTarget.classList.add('img-error');
          
          // Adicionar texto de erro genérico
          const parent = e.currentTarget.parentNode as HTMLElement;
          if (parent) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'absolute bottom-0 left-0 right-0 bg-red-500/20 text-xs text-red-400 p-1 text-center error-message';
            errorDiv.textContent = 'Erro ao carregar imagem';
            parent.appendChild(errorDiv);
          }
        }} 
        style={{ 
          minHeight: isOnePixelGif ? '80px' : '60px', 
          minWidth: isOnePixelGif ? '80px' : '60px',
          background: isImageBase64 ? 'rgba(30, 34, 53, 0.5)' : 'transparent'
        }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

  // Salvar alterações do modal de edição de imagem
  const handleSaveImageEdit = (newSrc: string, newAlt: string) => {
    if (editingImage) {
      handleImageChange(editingImage.id, newSrc, newAlt);
    }
  };

  const handleApplyChanges = () => {
    console.log("Applying changes...");
    setIsLoading(true);
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const head = doc.head;
      const body = doc.body;

      // --- Remover Pixels Antigos (identificados pelo atributo data-pixel-type) ---
      head.querySelectorAll('script[data-pixel-type]').forEach(el => el.remove());
      body.querySelectorAll('noscript[data-pixel-type="gtm-body"]').forEach(el => el.remove());
      console.log('Removed old pixel scripts identified by data-pixel-type.');

      // --- Aplicar Links ---
      links.forEach(linkData => {
        const linkElement = doc.querySelectorAll('a')[linkData.id]; // CUIDADO: Depende da ordem não mudar!
        if (linkElement) {
          linkElement.setAttribute('href', linkData.href);
          linkElement.innerText = linkData.text; // Pode ser problemático se o link tiver HTML interno
          if (linkData.target === '_blank') {
            linkElement.setAttribute('target', '_blank');
            // Adicionar rel="noopener noreferrer" por segurança
            linkElement.setAttribute('rel', 'noopener noreferrer'); 
          } else {
            linkElement.removeAttribute('target');
            linkElement.removeAttribute('rel');
          }
        }
      });
      
      // --- Aplicar Imagens ---
      images.forEach(imageData => {
        const imgElement = doc.querySelectorAll('img')[imageData.id]; // CUIDADO: Depende da ordem não mudar!
        if (imgElement) {
          imgElement.setAttribute('src', imageData.src);
          imgElement.setAttribute('alt', imageData.alt);
        }
      });
      console.log('Applied image changes.');

      // --- Aplicar Pixels Novos ---
      Object.keys(pixelScripts).forEach(key => {
        const type = key as PixelType;
        const scriptContent = pixelScripts[type];
        if (scriptContent && scriptContent.trim() !== '' && head) {
          try {
            // Criar um div temporário para parsear o script HTML
            const tempDiv = doc.createElement('div');
            tempDiv.innerHTML = scriptContent.trim(); 
            
            // Pegar todos os elementos filhos (scripts, noscripts, etc.)
            const elementsToAdd = Array.from(tempDiv.children);
            
            if (elementsToAdd.length > 0) {
              elementsToAdd.forEach(element => {
                // Adicionar atributo para identificar este pixel
                element.setAttribute('data-pixel-type', type);
                head.appendChild(element.cloneNode(true)); // Adicionar ao head
                console.log(`Added pixel script to head: ${type}`);
              });
            } else if (tempDiv.firstChild && tempDiv.firstChild.nodeType === Node.TEXT_NODE) {
               // Caso seja apenas texto (improvável para scripts, mas seguro)
               console.warn(`Pixel content for ${type} seems to be just text, not adding.`);
            } else {
               console.warn(`Could not parse script content for pixel: ${type}`);
            }

          } catch(e) {
            console.error(`Error processing pixel script for ${type}:`, e);
          }
        }
      });
      
      // Lógica específica para GTM Body (se existir)
      if (gtmBodyScript && gtmBodyScript.trim() !== '' && body) {
          try {
            const tempDiv = doc.createElement('div');
            tempDiv.innerHTML = gtmBodyScript.trim();
            const elementsToAdd = Array.from(tempDiv.children);
            if (elementsToAdd.length > 0) {
              elementsToAdd.forEach(element => {
                 // Idealmente, adicionaríamos ao início do body
                 // O noscript do GTM geralmente é recomendado logo após a abertura da tag <body>
                if (body.firstChild) {
                    body.insertBefore(element.cloneNode(true), body.firstChild);
                } else {
                    body.appendChild(element.cloneNode(true));
                }
                // Adicionar identificador
                element.setAttribute('data-pixel-type', 'gtm-body'); 
                 console.log('Added GTM body noscript.');
              });
            } else {
              console.warn('Could not parse GTM body noscript content.');
            }
          } catch(e) {
            console.error('Error processing GTM body script:', e);
          }
      }
      
      // --- Aplicar Config (Title, Description & Favicon) ---
      let titleTag = doc.querySelector('title');
      if (!titleTag) {
        titleTag = doc.createElement('title');
        doc.head.appendChild(titleTag);
      }
      titleTag.innerText = config.title;

      let descriptionTag = doc.querySelector('meta[name="description"]');
      if (!descriptionTag) {
        descriptionTag = doc.createElement('meta');
        descriptionTag.setAttribute('name', 'description');
        doc.head.appendChild(descriptionTag);
      }
      descriptionTag.setAttribute('content', config.description);

      // Atualizar favicon
      if (config.favicon) {
        // Remover favicon existentes
        doc.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(el => el.remove());
        
        // Adicionar novo favicon
        const faviconLink = doc.createElement('link');
        faviconLink.setAttribute('rel', 'icon');
        faviconLink.setAttribute('href', config.favicon);
        
        // Detectar tipo adequado com base na extensão se possível
        if (config.favicon.endsWith('.ico')) {
          faviconLink.setAttribute('type', 'image/x-icon');
        } else if (config.favicon.endsWith('.png')) {
          faviconLink.setAttribute('type', 'image/png');
        } else if (config.favicon.endsWith('.svg')) {
          faviconLink.setAttribute('type', 'image/svg+xml');
        } else if (config.favicon.includes(';base64,')) {
          // Extrair tipo do data URL
          const match = config.favicon.match(/^data:([^;]+);base64,/);
          if (match && match[1]) {
            faviconLink.setAttribute('type', match[1]);
          }
        }
        
        doc.head.appendChild(faviconLink);
      }
      
      // Serializar e salvar
      const newHtml = doc.documentElement.outerHTML;
      onSaveChanges(newHtml);
      onClose(); // Fechar modal após salvar

    } catch (error) {
      console.error("Error applying changes in Lightning Editor:", error);
      // Mostrar erro para o usuário
    } finally {
      setIsLoading(false);
    }
  };

  // Handler específico para o <select> HTML
  const handleLinkTargetChange = (id: number, value: string) => {
    const targetValue = value === '_blank' ? '_blank' : '_self';
    handleLinkChange(id, 'target', targetValue);
  };

  // --- Componente Auxiliar para Acordeão de Pixel ---
  const PixelAccordionItem: React.FC<{ type: PixelType }> = ({ type }) => {
    const config = PIXEL_CONFIG[type];
    const script = pixelScripts[type];
    
    return (
      <details className="bg-[#1A1D2A] rounded-lg border border-[#2D3748] overflow-hidden group">
        <summary className="flex justify-between items-center p-4 cursor-pointer hover:bg-[#2d3348] transition-colors">
          <span className="text-md font-semibold text-[#8A63F4]">{config.name}</span>
          <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180" />
        </summary>
        <div className="p-4 border-t border-[#2D3748] space-y-3">
           <p className="text-sm text-gray-400 mb-2">{config.description}</p>
          <textarea 
            value={script}
            onChange={(e) => handlePixelChange(type, e.target.value)}
            className="w-full h-32 p-2 bg-[#1e2235] border border-[#3d435a] text-white rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#8A63F4] resize-none"
            placeholder={`Cole o código do ${config.name} aqui...`} // Placeholder dinâmico
            spellCheck="false"
          />
          {/* Adicionar link de documentação se necessário */}
          {/* <a href="#" className="text-sm text-blue-400 hover:underline">Ver documentação</a> */} 
        </div>
      </details>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full bg-[#151825] border-[#2D3748] text-white cursor-[url('/cursor.svg'),_auto]" 
        style={{paddingRight: "24px"}}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Botão X personalizado com área clicável maior */}
        <div className="absolute right-4 top-4 z-50">
          <button
            onClick={onClose}
            className="bg-[#1e2235] hover:bg-[#2d3348] text-gray-400 hover:text-white transition-colors rounded-full w-8 h-8 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#8A63F4] focus:ring-offset-2 focus:ring-offset-[#151825]"
            aria-label="Fechar modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#8A63F4]">⚡ Edição Relâmpago</DialogTitle>
          <DialogDescription className="text-gray-400">
            Edite rapidamente links, imagens, pixels e configurações da sua página.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="links" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4 bg-[#1A1D2A] p-1 rounded-lg">
            <TabsTrigger value="links" className="data-[state=active]:bg-[#8A63F4] data-[state=active]:text-white rounded-md px-3 py-1.5 text-sm font-medium">Links</TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-[#8A63F4] data-[state=active]:text-white rounded-md px-3 py-1.5 text-sm font-medium">Imagens</TabsTrigger>
            <TabsTrigger value="pixels" className="data-[state=active]:bg-[#8A63F4] data-[state=active]:text-white rounded-md px-3 py-1.5 text-sm font-medium">Pixels</TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-[#8A63F4] data-[state=active]:text-white rounded-md px-3 py-1.5 text-sm font-medium">Configurações</TabsTrigger>
          </TabsList>

          {/* Aba Links */}
          <TabsContent value="links" className="mt-6 max-h-[60vh] overflow-y-auto pr-2">
            {isLoading ? (
              <p>Analisando links...</p>
            ) : links.length > 0 ? (
              <div className="space-y-6">
                {links.map((link) => (
                  <div key={link.id} className="bg-[#1A1D2A] p-4 rounded-lg border border-[#2D3748]">
                    <h3 className="text-md font-semibold mb-3 text-[#8A63F4]">🔗 Link #{link.id + 1}</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`link-url-${link.id}`} className="text-sm font-medium text-gray-300">URL</Label>
                        <Input 
                          id={`link-url-${link.id}`}
                          type="url" 
                          value={link.href}
                          onChange={(e) => handleLinkChange(link.id, 'href', e.target.value)}
                          className="mt-1 bg-[#1e2235] border-[#3d435a] text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`link-text-${link.id}`} className="text-sm font-medium text-gray-300">Texto do Link</Label>
                        <Input 
                          id={`link-text-${link.id}`}
                          type="text" 
                          value={link.text}
                          onChange={(e) => handleLinkChange(link.id, 'text', e.target.value)}
                          className="mt-1 bg-[#1e2235] border-[#3d435a] text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`link-target-${link.id}`} className="text-sm font-medium text-gray-300">Abrir em</Label>
                        {/* Usar <select> HTML padrão estilizado */}
                        <select 
                          id={`link-target-${link.id}`}
                          value={link.target}
                          onChange={(e) => handleLinkChange(link.id, 'target', e.target.value as '_self' | '_blank')}
                          className="mt-1 w-full bg-[#1e2235] border border-[#3d435a] text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8A63F4]"
                        >
                          <option value="_self">Janela atual</option>
                          <option value="_blank">Nova Janela</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">Nenhum link editável encontrado nesta página.</p>
            )}
          </TabsContent>

          {/* Aba Imagens */ }
          <TabsContent value="images" className="mt-6 max-h-[60vh] overflow-y-auto pr-2">
            {isLoading ? (
              <p>Analisando imagens...</p>
            ) : images.length > 0 ? (
              <>
                {/* Contador de imagens reais vs. total */}
                {(() => {
                  const realImages = images.filter(image => {
                    // Identificar GIFs de tracking e imagens muito pequenas
                    const isTrackingGif = (
                      // GIFs conhecidos de 1x1px
                      (image.src === 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' || 
                      image.src === 'data:image/gif;base64,R0lGODdhAQABAPAAAMPDwwAAACwAAAAAAQABAAACAkQBADs=') ||
                      // Qualquer GIF com dimensões 1x1
                      ((image.type?.toLowerCase() === 'gif' || image.src.includes('.gif') || 
                       image.src.startsWith('data:image/gif')) && 
                       (image.width === 1 || image.height === 1)) ||
                      // Imagens 1x1 de qualquer tipo
                      (image.width === 1 && image.height === 1)
                    );
                    
                    return !isTrackingGif;
                  });
                  
                  if (realImages.length !== images.length) {
                    return (
                      <div className="mb-4 text-xs text-gray-400 flex items-center gap-1.5">
                        <Info size={14} className="text-[#8A63F4]" />
                        Exibindo {realImages.length} de {images.length} imagens 
                        <span className="text-[#8A63F4]">(GIFs de rastreamento foram ocultados)</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              
                <div className="grid grid-cols-2 gap-4">
                  {images
                    .filter(image => {
                      // Identificar GIFs de tracking e imagens muito pequenas
                      const isTrackingGif = (
                        // GIFs conhecidos de 1x1px
                        (image.src === 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' || 
                        image.src === 'data:image/gif;base64,R0lGODdhAQABAPAAAMPDwwAAACwAAAAAAQABAAACAkQBADs=') ||
                        // Qualquer GIF com dimensões 1x1
                        ((image.type?.toLowerCase() === 'gif' || image.src.includes('.gif') || 
                         image.src.startsWith('data:image/gif')) && 
                         (image.width === 1 || image.height === 1)) ||
                        // Imagens 1x1 de qualquer tipo
                        (image.width === 1 && image.height === 1)
                      );
                      
                      // Retornar true apenas para imagens reais (não tracking pixels)
                      return !isTrackingGif;
                    })
                    .map((image) => {
                      return (
                        <div key={image.id} className="bg-[#1A1D2A] p-3 rounded-lg border border-[#2D3748] flex flex-col items-center text-center">
                          <div className="flex justify-between items-center w-full mb-2">
                            <h4 className="text-sm font-semibold text-[#8A63F4] flex items-center gap-1">
                              <ImageIcon size={14} /> Imagem #{image.id + 1}
                            </h4>
                            <Button 
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-white hover:bg-[#2d3348] p-1 h-7 w-7"
                              onClick={() => handleEditImageClick(image)}
                              title="Editar Imagem"
                            >
                              <Pencil size={14} />
                            </Button>
                          </div>
                          <div className="w-full h-48 mb-2 flex items-center justify-center overflow-hidden rounded bg-[#1e2235] relative">
                            {/* Dimensões como overlay para depuração */}
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 opacity-30 pointer-events-none">
                              {image.width && image.height ? `${image.width}×${image.height}px` : ''}
                            </div>
                            
                            {/* Renderização segura da imagem */}
                            <div className="w-full h-full flex items-center justify-center">
                              {renderImageSafely(image)}
                            </div>
                          </div>
                          {/* Mostrar metadados */}
                          <div className="text-xs text-gray-500 w-full grid grid-cols-3 gap-1 mt-auto pt-2 border-t border-[#2D3748]">
                            <div>
                              <span className="block font-medium">Tipo</span>
                              {/* Exibir tipo inferido ou placeholder */}
                              <span className="text-gray-300">{image.type || '---'}</span> 
                            </div>
                            <div>
                              <span className="block font-medium">Formato</span>
                              <span className="text-gray-300">{image.aspectRatio || '---'}</span>
                            </div>
                            <div>
                              <span className="block font-medium">Qualidade</span>
                              <span className={`${
                                image.quality === 'Baixa' ? 'text-red-400' : 
                                image.quality === 'Média' ? 'text-yellow-400' : 
                                image.quality === 'Alta' ? 'text-green-400' : 
                                image.quality === 'HD' ? 'text-blue-400' : 'text-gray-300'
                              }`}>
                                {image.quality || '---'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-center py-4">Nenhuma imagem encontrada nesta página.</p>
            )}
          </TabsContent>

          {/* Aba Pixels */} 
          <TabsContent value="pixels" className="mt-6 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
             <div className="flex items-start p-3 rounded-lg bg-[#1A1D2A] border border-[#3d435a] text-gray-300 text-sm">
                <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-[#8A63F4]" />
                <span>Adicione os códigos de rastreamento para análise e remarketing. Os pixels serão inseridos automaticamente no <code>&lt;head&gt;</code> do seu site.</span>
             </div>
            
             {isLoading ? (
              <p>Analisando pixels...</p>
            ) : (
              <> 
                {(Object.keys(PIXEL_CONFIG) as PixelType[]).map((type) => (
                  <PixelAccordionItem key={type} type={type} />
                ))}
              </>
            )}
          </TabsContent>

          {/* Aba Configurações */}
          <TabsContent value="config" className="mt-6 space-y-4">
             {isLoading ? (
              <p>Carregando configurações...</p>
            ) : (
              <>
                <div className="bg-[#1A1D2A] p-4 rounded-lg border border-[#2D3748]">
                  <Label htmlFor="config-title" className="text-sm font-medium text-gray-300">Título da Página</Label>
                  <Input 
                    id="config-title"
                    type="text" 
                    value={config.title}
                    onChange={(e) => setConfig({...config, title: e.target.value})}
                    className="mt-1 bg-[#1e2235] border-[#3d435a] text-white"
                  />
                </div>
                 <div className="bg-[#1A1D2A] p-4 rounded-lg border border-[#2D3748]">
                  <Label htmlFor="config-description" className="text-sm font-medium text-gray-300">Descrição da Página (Meta Description)</Label>
                  <textarea 
                    id="config-description"
                    value={config.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({...config, description: e.target.value})}
                    className="mt-1 w-full bg-[#1e2235] border border-[#3d435a] text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8A63F4] h-24"
                    rows={3}
                    placeholder="Digite a meta description..."
                  />
                </div>
                <div className="bg-[#1A1D2A] p-4 rounded-lg border border-[#2D3748]">
                  <Label htmlFor="config-favicon" className="text-sm font-medium text-gray-300">Favicon</Label>
                  <div className="mt-2 flex items-start space-x-3">
                    {config.favicon && (
                      <div className="flex-shrink-0 w-10 h-10 bg-[#1e2235] rounded overflow-hidden flex items-center justify-center">
                        <img 
                          src={config.favicon} 
                          alt="Favicon" 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            // Remover src em caso de erro e mostrar fallback
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <svg className="w-6 h-6 text-gray-400 hidden" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="18" height="18" x="3" y="3" rx="2" stroke="currentColor" strokeWidth="2" />
                          <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-grow space-y-2">
                      <Input 
                        id="config-favicon"
                        type="text" 
                        value={config.favicon}
                        onChange={(e) => setConfig({...config, favicon: e.target.value})}
                        className="w-full bg-[#1e2235] border-[#3d435a] text-white"
                        placeholder="URL do favicon (ex: /favicon.ico)"
                      />
                      <div className="flex items-center text-xs text-gray-400">
                        <span>Ou faça upload:</span>
                        <label 
                          htmlFor="favicon-upload" 
                          className="ml-2 px-3 py-1 bg-[#2d3348] hover:bg-[#3a4157] text-white rounded cursor-pointer transition-colors"
                        >
                          Escolher arquivo
                          <input 
                            id="favicon-upload" 
                            type="file" 
                            className="hidden" 
                            accept=".ico,.png,.jpg,.jpeg,.svg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Converter para base64 Data URL
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setConfig({...config, favicon: event.target.result as string});
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <span className="ml-2 text-gray-500">(Recomendado: .ico, .png - 32x32 ou 16x16)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 pt-4 border-t border-[#2D3748]">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-[#3d435a] text-white hover:bg-[#2d3348]"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleApplyChanges}
            className="bg-[#8A63F4] hover:bg-[#7B52E5] text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Aplicar Alterações'}
          </Button>
        </DialogFooter>
        
        {/* Renderizar Modal de Edição de Imagem */} 
        {editingImage && (
           <EditImageModal
             isOpen={isEditImageModalOpen}
             onClose={() => setIsEditImageModalOpen(false)}
             currentSrc={editingImage.src}
             currentAlt={editingImage.alt}
             onSave={handleSaveImageEdit}
           />
        )}
      </DialogContent>
    </Dialog>
  );
}; 