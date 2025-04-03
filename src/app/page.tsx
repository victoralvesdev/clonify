'use client';

import React, { useState, useEffect } from 'react';
import { URLInput } from '../components/ui/URLInput';
import { Frame } from '../components/ui/Preview/Frame';
import GrapesEditor from '../components/ui/Editor/GrapesEditor';
import { 
  ArrowLeft, 
  Zap, 
  Download, 
  Copy, 
  Upload, 
  Save,
  HomeIcon,
  BookOpen,
  LockIcon,
  FileText,
  ChevronDown,
  LibraryIcon,
  Filter,
  UserIcon,
  Globe2,
  Globe,
  LayoutTemplate,
  Sparkles,
  MessageSquare,
  LayoutDashboard,
  Plus,
  Files,
  Users,
  X,
  Eye
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { toast } from 'react-toastify';
import { Sidebar, SidebarBody, SidebarLink, Logo, LogoIcon, SidebarContext, UserProfile } from '@/components/ui/Sidebar';
import { cn } from '@/lib/utils';
import { BackgroundEffect } from '@/components/ui/BackgroundEffect';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { PreLoader } from '@/components/ui/PreLoader';
import { GlassCard } from "@/components/ui/GlassCard";
import { CloneViewer } from '@/components/ui/CloneViewer';
import { crawlPage } from '@/services/crawler';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SavedPage, getSavedPages, deletePage, updatePage } from '@/data/SavedPages';
import SavedPageListItem from '@/components/ui/SavedPageListItem';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/Dialog';
import { LightningEditorModal } from '@/components/ui/LightningEditorModal';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import AdCard from '@/components/ui/AdCard';
import { rapidApiAdsService } from '@/services/rapidApiAdsService';
import { FacebookAd } from '@/types/facebook';

type Status = 'input' | 'cloning' | 'preview' | 'editing' | 'cloned' | 'error';

const STATUS = {
  INPUT: 'input' as Status,
  CLONING: 'cloning' as Status,
  PREVIEW: 'preview' as Status,
  EDITING: 'editing' as Status,
  CLONED: 'cloned' as Status,
  ERROR: 'error' as Status,
} as const;

const ITEMS_PER_PAGE = 10;

export default function Home() {
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Status>(STATUS.INPUT);
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [processedHtml, setProcessedHtml] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('inicio');
  const [isClonadorOpen, setIsClonadorOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Clonar Site, 2: Personalizar
  const [isLoading, setIsLoading] = useState(false);
  const [incompatibleTechnologies, setIncompatibleTechnologies] = useState<string[]>([]);
  const [savedPages, setSavedPages] = useState<SavedPage[]>([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentViewPage, setCurrentViewPage] = useState<SavedPage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [isLightningEditorOpen, setIsLightningEditorOpen] = useState(false);
  
  // Estados para a funcionalidade de busca de anúncios do Facebook
  const [searchResults, setSearchResults] = useState<FacebookAd[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('br');
  const [selectedPlatform, setSelectedPlatform] = useState('any');
  const [selectedMediaType, setSelectedMediaType] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [minActiveAds, setMinActiveAds] = useState(1);

  const handleTabChange = (tab: string) => {
    console.log(`[handleTabChange] Tab anterior: ${activeTab}, Status anterior: ${status}`);
    console.log(`[handleTabChange] Mudando para tab: ${tab}`);
    setIsLoading(true);
    setActiveTab(tab);
    // Se estiver explicitamente indo para 'clonar', garantir que começamos no input
    if (tab === 'clonar') {
      console.log('[handleTabChange] Definindo status para INPUT ao ir para clonar');
      setStatus(STATUS.INPUT);
      setEditingPageId(null); // Limpar ID de edição ao iniciar nova clonagem
      setHtml(''); // Limpar HTML anterior
      setCss(''); // Limpar CSS anterior
      setUrl(''); // Limpar URL anterior
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 500); // Reduzido para 500ms para agilidade
  };

  const handleClone = async () => {
    if (!url) return;

    setError(null);
    setStatus(STATUS.CLONING);
    setStep(1);
    
    try {
      // Iniciar o progresso simulado
      setProgress(0);
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      console.log('Clonando site:', url);
      
      // Adicionar protocolo se não existir
      let targetUrl = url;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      // Fazer a requisição para o crawler
      const response = await fetch('/api/crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      // Parar o progresso simulado
      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao clonar o site');
      }

      const data = await response.json();
      
      if (!data.html) {
        throw new Error('HTML não encontrado na resposta');
      }
      
      console.log("API retornou HTML:", { 
        exists: !!data.html,
        length: data.html?.length || 0,
        preview: data.html.substring(0, 100) + '...'
      });
      
      console.log("Recursos:", data.resources);
      
      // Baixar recursos CSS e JS
      let processedHtml = data.html;
      
      // Cachear recursos CSS
      if (data.resources && data.resources.css && data.resources.css.length > 0) {
        const cssContents = await Promise.all(
          data.resources.css.map(async (cssUrl: string) => {
            try {
              const response = await fetch(`/api/proxy?url=${encodeURIComponent(cssUrl)}&type=css`);
              if (response.ok) {
                const cssData = await response.json();
                return {
                  url: cssUrl,
                  content: cssData.content
                };
              }
              return { url: cssUrl, content: '' };
            } catch (error) {
              console.error(`Erro ao baixar CSS: ${cssUrl}`, error);
              return { url: cssUrl, content: '' };
            }
          })
        );
        
        // Guardar os estilos CSS para uso posterior
        const clonedStyles = cssContents.map(item => ({
          url: item.url,
          content: item.content
        }));
        
        // Combinar todos os estilos CSS em uma única string
        const combinedCss = clonedStyles
          .map(style => style.content)
          .filter(Boolean)
          .join('\n');
        
        // Guardar o CSS combinado no estado
        setCss(combinedCss);
      }
      
      // Cachear recursos JS
      if (data.resources && data.resources.js && data.resources.js.length > 0) {
        const jsContents = await Promise.all(
          data.resources.js.map(async (jsUrl: string) => {
            try {
              const response = await fetch(`/api/proxy?url=${encodeURIComponent(jsUrl)}&type=js`);
              if (response.ok) {
                const jsData = await response.json();
                return {
                  url: jsUrl,
                  content: jsData.content
                };
              }
              return { url: jsUrl, content: '' };
            } catch (error) {
              console.error(`Erro ao baixar JS: ${jsUrl}`, error);
              return { url: jsUrl, content: '' };
            }
          })
        );
        
        // Guardar os scripts JS para uso posterior
        const clonedScripts = jsContents.map(item => ({
          url: item.url,
          content: item.content
        }));
      }
      
      // Definir o HTML e detectar tecnologias
      setHtml(processedHtml);
      
      // Detectar tecnologias
      const detectedTech = [];
      const incompatibleTech = [];

      // Tecnologias Web básicas
      if (data.html.includes('<!DOCTYPE html>')) detectedTech.push('HTML5');
      if (data.html.includes('<html')) detectedTech.push('HTML');
      if (data.html.includes('text/css')) detectedTech.push('CSS');

      // Frameworks e bibliotecas JavaScript
      if (data.html.toLowerCase().includes('jquery')) detectedTech.push('jQuery');
      if (data.html.toLowerCase().includes('bootstrap')) detectedTech.push('Bootstrap');
      if (data.html.toLowerCase().includes('tailwind')) detectedTech.push('Tailwind CSS');
      if (data.html.toLowerCase().includes('font-awesome')) detectedTech.push('Font Awesome');

      // Frameworks Frontend
      if (data.html.toLowerCase().includes('react')) detectedTech.push('React');
      if (data.html.toLowerCase().includes('vue')) detectedTech.push('Vue.js');
      if (data.html.toLowerCase().includes('angular')) detectedTech.push('Angular');
      if (data.html.toLowerCase().includes('svelte')) detectedTech.push('Svelte');

      // CMS e Plataformas de E-commerce (potencialmente compatíveis)
      if (data.html.toLowerCase().includes('wordpress')) detectedTech.push('WordPress');
      if (data.html.toLowerCase().includes('woocommerce')) detectedTech.push('WooCommerce');
      if (data.html.toLowerCase().includes('elementor')) detectedTech.push('Elementor');
      if (data.html.toLowerCase().includes('divi')) detectedTech.push('Divi');

      // Tecnologias potencialmente incompatíveis
      if (data.html.toLowerCase().includes('shopify')) incompatibleTech.push('Shopify');
      if (data.html.toLowerCase().includes('vtex')) incompatibleTech.push('VTEX');
      if (data.html.toLowerCase().includes('magento')) incompatibleTech.push('Magento');
      if (data.html.toLowerCase().includes('drupal')) incompatibleTech.push('Drupal');
      if (data.html.toLowerCase().includes('joomla')) incompatibleTech.push('Joomla');
      if (data.html.toLowerCase().includes('wix')) incompatibleTech.push('Wix');
      if (data.html.toLowerCase().includes('squarespace')) incompatibleTech.push('Squarespace');
      if (data.html.toLowerCase().includes('webflow')) incompatibleTech.push('Webflow');
      if (data.html.toLowerCase().includes('bigcommerce')) incompatibleTech.push('BigCommerce');

      // Verificar scripts específicos e meta tags
      if (data.html.includes('gtag') || data.html.includes('googletagmanager')) detectedTech.push('Google Tag Manager');
      if (data.html.includes('analytics.js') || data.html.includes('ga.js') || data.html.includes('gtag')) detectedTech.push('Google Analytics');
      if (data.html.includes('fbq(') || data.html.includes('facebook-pixel')) detectedTech.push('Facebook Pixel');
      if (data.html.includes('tiktok')) detectedTech.push('TikTok Pixel');

      // APIs e Integrações (potencialmente incompatíveis)
      if (data.html.includes('api.whatsapp') || data.html.includes('wa.me')) detectedTech.push('WhatsApp API');
      if (data.html.includes('maps.google') || data.html.includes('google.com/maps')) detectedTech.push('Google Maps');
      if (data.html.includes('youtube.com/embed')) detectedTech.push('YouTube Embed');
      if (data.html.includes('player.vimeo')) detectedTech.push('Vimeo Player');

      // Atribuir as tecnologias detectadas ao estado
      setTechnologies(detectedTech);
      setIncompatibleTechnologies(incompatibleTech);

      // Atualizar o status e progresso
      setProgress(100);
      setStatus(STATUS.PREVIEW);
      
      // Mostrar notificação de sucesso
      toast.success('🚀 Site clonado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Avançar para o próximo passo após breve delay
      setTimeout(() => {
        setStep(2);
      }, 500);
      
    } catch (error) {
      console.error('Erro ao clonar:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setStatus(STATUS.ERROR);
      setProgress(0);
    }
  };

  const handleBack = () => {
    setStatus(STATUS.INPUT);
    setProgress(0);
    setHtml('');
    setCss('');
    setTechnologies([]);
    setIncompatibleTechnologies([]);
    setError(null);
    setStep(1); // Voltar para o passo de clonagem
  };

  const handleEdit = () => {
    setStatus(STATUS.EDITING);
    setIsEditing(true);
  };

  const handleBackFromEditor = () => {
    setStatus(STATUS.PREVIEW);
    setIsEditing(false);
    setEditingPageId(null);
  };

  const handleSave = async () => {
    try {
      setError(null);
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html, url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar a página');
      }

      toast.success('Página salva com sucesso!', {
        position: 'top-right',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Manter na tela de edição
      setIsEditing(false); // Apenas alterna para o modo de visualização

      return true;
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar a página. Tente novamente.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return false;
    }
  };

  const handleDownload = async () => {
    try {
      setError(null);
      
      // Criar um novo objeto ZIP
      const zip = new JSZip();
      
      // Adicionar o HTML principal (com as alterações da Edição Relâmpago)
      zip.file("index.html", processedHtml);
      
      // Adicionar o CSS
      if (css) {
        zip.file("styles.css", css);
      }
      
      // Gerar o arquivo ZIP
      const content = await zip.generateAsync({ type: "blob" });
      
      // Criar URL para download
      const url = URL.createObjectURL(content);
      
      // Criar elemento para download
      const a = document.createElement('a');
      a.href = url;
      a.download = "site_clonado.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Liberar URL
      URL.revokeObjectURL(url);
      
      toast.success('Download iniciado!', {
        position: 'top-right',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error: any) {
      console.error('Erro ao fazer download:', error);
      setError(error.message || 'Ocorreu um erro ao fazer o download');
      toast.error('Erro ao gerar o arquivo ZIP. Tente novamente.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleCopy = async () => {
    try {
      setError(null);
      await navigator.clipboard.writeText(html);
    } catch (error: any) {
      console.error('Erro ao copiar:', error);
      setError(error.message || 'Ocorreu um erro ao copiar o HTML');
    }
  };

  const sidebarLinks = [
    {
      label: "Início",
      href: "#",
      icon: <HomeIcon className="h-5 w-5 flex-shrink-0" />,
      onClick: () => handleTabChange('inicio'),
      isActive: activeTab === 'inicio'
    },
    {
      label: "Tutoriais",
      href: "#",
      icon: <BookOpen className="h-5 w-5 flex-shrink-0" />,
      suffix: <LockIcon className="h-3 w-3" />
    },
    {
      label: "Domínios",
      href: "#",
      icon: <Globe2 className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Clonador",
      href: "#",
      icon: <Copy className="w-5 h-5" />,
      suffix: <ChevronDown className={cn(
        "w-4 h-4 transition-transform duration-500 ease-in-out",
        isClonadorOpen ? "transform rotate-180" : ""
      )} />,
      onClick: () => setIsClonadorOpen(!isClonadorOpen),
      isActive: activeTab === 'clonar' || activeTab === 'clonadas'
    },
    {
      isDropdownContainer: true,
      isVisible: isClonadorOpen,
      items: [
      {
        label: "Clonar Páginas",
        href: "#",
        icon: <Plus className="w-5 h-5" />,
        onClick: () => handleTabChange('clonar'),
        isActive: activeTab === 'clonar'
      },
      {
        label: "Páginas Clonadas",
        href: "#",
        icon: <Files className="w-5 h-5" />,
        onClick: () => handleTabChange('clonadas'),
        isActive: activeTab === 'clonadas'
      }
      ]
    },
    {
      label: "Templates",
      href: "#",
      icon: <LayoutTemplate className="h-5 w-5 flex-shrink-0" />,
      onClick: () => handleTabChange('templates'),
      isActive: activeTab === 'templates'
    },
    {
      isDivider: true,
      className: "border-t border-[#1e2235] my-2 opacity-70"
    },
    {
      label: "Espione Anuncios",
      href: "#",
      icon: <Eye className="h-5 w-5 flex-shrink-0" />,
      onClick: () => handleTabChange('espione'),
      isActive: activeTab === 'espione',
      isExclusive: true
    }
  ];

  const templateFilters = ["PLR", "Curso", "Encapsulado", "iGaming", "Termos de uso"];

  const renderContent = () => {
    console.log(`[renderContent] Rendering - activeTab: ${activeTab}, status: ${status}, editingPageId: ${editingPageId}`);
    if (error) {
      return (
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={handleBack} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      );
    }

    switch (status) {
      case STATUS.INPUT:
        return <URLInput onSubmit={handleClone} isLoading={status === STATUS.CLONING} />;
      case STATUS.PREVIEW:
        return (
          <div className="flex-1 py-4 w-full">
            <CloneViewer
              html={processedHtml}
              initialCss={css}
              technologies={technologies}
              incompatibleTechnologies={incompatibleTechnologies}
              onBack={handleBack}
              onEdit={handleEdit}
              onLightningEdit={() => setIsLightningEditorOpen(true)}
              onDownload={handleDownload}
              onError={setError}
            />
          </div>
        );
      case STATUS.EDITING:
        return (
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={handleBackFromEditor}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para visualização
              </Button>
            </div>
            <div className="w-full h-[calc(100vh-8rem)]">
              <GrapesEditor
                initialHtml={processedHtml}
                initialCss={css}
                editingPageId={editingPageId}
                onBack={handleBackFromEditor}
                onSavePage={handleSavePage}
                onNavigate={handleTabChange}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Carregar páginas salvas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pages = getSavedPages();
      console.log('Páginas carregadas na inicialização:', pages);
      setSavedPages(pages);
    }
  }, []);

  // Processar HTML após clonagem para corrigir lazy load do Elementor
  useEffect(() => {
    if (!html) {
      setProcessedHtml(''); // Limpar se o HTML original for limpo
      return;
    }

    let tempProcessedHtml = html;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const lazyContainers = doc.querySelectorAll('.e-con.e-parent:not(.e-lazyloaded)');
      
      if (lazyContainers.length > 0) {
        console.log(`Home: Adicionando classe 'e-lazyloaded' a ${lazyContainers.length} containers Elementor no HTML clonado.`);
        lazyContainers.forEach(container => {
          container.classList.add('e-lazyloaded');
        });
        tempProcessedHtml = doc.documentElement.outerHTML;
      }
    } catch (error) {
      console.error("Home: Erro ao processar HTML para lazy load:", error);
      // Continuar com o HTML original em caso de erro
    }
    setProcessedHtml(tempProcessedHtml);

  }, [html]); // Executar sempre que o HTML original mudar

  // Função para criar um visualizador de depuração direto no DOM
  const createDebugView = (title: string, content: string) => {
    // Removido completamente para não gerar visualizações de debug
    return;
  };

  // Função para buscar anúncios do Facebook
  const searchFacebookAds = async (params: {
    keyword: string;
    country?: string;
    platform?: string;
    mediaType?: string;
    status?: string;
    minActiveAds: number;
  }) => {
    try {
      setIsSearching(true);
      setError(null);
      setSearchResults([]);

      // Verificar configuração da API
      const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
      const apiUrl = process.env.NEXT_PUBLIC_RAPIDAPI_URL;
      const apiHost = process.env.NEXT_PUBLIC_RAPIDAPI_HOST;
      
      if (!apiKey || !apiUrl || !apiHost) {
        const errorMsg = 'Configuração da API incompleta. Verifique as variáveis de ambiente NEXT_PUBLIC_RAPIDAPI_KEY, NEXT_PUBLIC_RAPIDAPI_URL e NEXT_PUBLIC_RAPIDAPI_HOST no arquivo .env.local.';
        console.error(errorMsg);
        setError(errorMsg);
        toast.error('Configuração da API RapidAPI incompleta. Verifique o arquivo .env.local e reinicie o servidor.');
        return;
      }
      
      try {
        const ads = await rapidApiAdsService.searchAds({
          searchTerms: params.keyword,
          state: params.country,
          minActiveAds: params.minActiveAds
        });

        // Filtrar anúncios sem conteúdo válido antes de exibir
        const validAds = ads.filter(ad => {
          const hasText = Boolean(ad.ad_creative_bodies?.[0] || ad.ad_creative_link_descriptions?.[0]);
          const hasMedia = Boolean(ad.media_urls?.image || ad.media_urls?.video);
          return hasText || hasMedia;
        });

        console.log('Total de anúncios encontrados:', ads.length);
        console.log('Anúncios válidos para exibição:', validAds.length);
        
        setSearchResults(validAds);
        setHistorySearchTerm(params.keyword);

        // Se encontrou anúncios com sucesso
        if (validAds.length > 0) {
          toast.success(`Encontrados ${validAds.length} anúncios.`);
        } else {
          toast.info('Nenhum anúncio válido encontrado com os critérios especificados.');
        }
      } catch (err) {
        console.error('Erro na chamada à API:', err);
        
        const errorMsg = err instanceof Error 
          ? err.message
          : 'Erro desconhecido ao buscar anúncios. Verifique a configuração da API.';
          
        setError(errorMsg);
        
        toast.error('Falha ao buscar anúncios do Facebook. Verifique sua chave de API e assinatura no RapidAPI.');
        
        // Garantir que não haja resultados para exibição
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erro geral na busca:', error);
      
      const errorMsg = error instanceof Error 
        ? error.message 
        : 'Ocorreu um erro ao buscar anúncios. Tente novamente mais tarde.';
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSearching(false);
    }
  };

  // Função para salvar ou atualizar página
  const handleSavePage = (savedOrUpdatedPage: SavedPage) => {
    console.log('Página salva/atualizada recebida no Home:', savedOrUpdatedPage);
    const updatedPages = getSavedPages();
    setSavedPages(updatedPages);
    
    // Resetar editingPageId após salvar/atualizar
    // Isso é importante para que o próximo clique em "Salvar" crie uma nova página
    // a menos que "Editar" seja clicado novamente.
    setEditingPageId(null); 
    
    setActiveTab('clonadas');
    setCurrentPage(1); 
    // A notificação será mostrada pelo GrapesEditor após a confirmação
    // toast.success(`Página "${savedOrUpdatedPage.title}" salva/atualizada com sucesso!`);
  };
  
  // Função para deletar página (atualizada para recarregar)
  const handleDeleteSavedPage = (savedPage: SavedPage) => {
    if (window.confirm(`Tem certeza que deseja excluir a página "${savedPage.title}"?`)) {
      const success = deletePage(savedPage.id);
      if (success) {
        // Recarregar a lista após deletar
        const updatedPages = getSavedPages();
        setSavedPages(updatedPages);
        // Ajustar página atual se necessário (ex: deletou o último item da última página)
        const totalPages = Math.ceil(updatedPages.length / ITEMS_PER_PAGE);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        } else if (updatedPages.length === 0) {
          setCurrentPage(1);
        }
        toast.info(`Página "${savedPage.title}" excluída.`);
      } else {
        toast.error('Erro ao excluir a página.');
      }
    }
  };

  // Visualizar uma página salva
  const handleViewSavedPage = (savedPage: SavedPage) => {
    setCurrentViewPage(savedPage);
    setViewModalOpen(true);
  };

  // Editar uma página salva
  const handleEditSavedPage = (savedPage: SavedPage) => {
    // Usar o HTML e CSS diretamente da página salva (já devem estar 'corretos')
    // O useEffect cuidará do processamento se necessário, embora idealmente
    // o HTML salvo não precise mais disso.
    setHtml(savedPage.html);
    setCss(savedPage.css);
    setUrl(savedPage.originalUrl || '');
    setStatus(STATUS.EDITING as Status);
    setEditingPageId(savedPage.id);
    setActiveTab('clonar');
  };

  // Resetar página atual quando o termo de busca muda
  useEffect(() => {
    setCurrentPage(1);
  }, [historySearchTerm]);

  // Filtrar páginas com base no termo de busca
  const filteredPages = historySearchTerm
    ? savedPages.filter(page => 
        page.title.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        page.originalUrl?.toLowerCase().includes(historySearchTerm.toLowerCase())
      )
    : savedPages;

  // Lógica de Paginação
  const totalPages = Math.ceil(filteredPages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredPages.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Função para salvar alterações da Edição Relâmpago
  const handleLightningSave = (newHtml: string) => {
    console.log("Home: Salvando alterações da Edição Relâmpago...");
    setProcessedHtml(newHtml); // Atualiza o HTML processado que é usado no preview/editor
    setHtml(newHtml); // Atualiza também o HTML base (importante se formos salvar permanentemente depois)
    toast.success('Alterações rápidas aplicadas!');
    // Nota: Isso NÃO salva permanentemente no localStorage. O usuário precisaria
    // entrar no editor visual e salvar por lá para persistir as mudanças.
    // Ou poderíamos adicionar lógica para salvar aqui também se necessário.
  };

  // Adicionar função para buscar anúncios por página
  const searchPageAds = async (pageId: string) => {
    try {
      setIsSearching(true);
      setError(null);

      console.log('Buscando anúncios da página:', pageId);

      const result = await rapidApiAdsService.getPageAds({
        pageId: pageId,
        country: selectedCountry,
        minActiveAds: minActiveAds
      });

      console.log('Anúncios encontrados:', result.length);
      setSearchResults(result);

    } catch (error) {
      console.error('Erro ao buscar anúncios da página:', error);
      setError('Erro ao buscar anúncios da página. Por favor, tente novamente.');
      toast.error('Erro ao buscar anúncios da página. Por favor, tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <PreLoader />
      <main 
        className="min-h-screen bg-[#030617] relative overflow-auto transition-all duration-300 ease-in-out cursor-[url('/cursor.svg'),_auto]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(138, 99, 244, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(138, 99, 244, 0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      >
        <div className="min-h-screen flex relative z-10">
          {!isEditing && (
            <Sidebar>
              <SidebarBody className="h-full flex flex-col py-6">
                <div>
                  <Logo />
                </div>
                
                <div className="mt-8 pt-8 border-t border-[#1e2235] flex-1 overflow-y-auto">
                  <div className="flex flex-col space-y-2">
                    {sidebarLinks.map((link, idx) => (
                      <SidebarLink key={idx} link={link} />
                    ))}
                  </div>
                </div>

                <div className="mt-auto">
                  <UserProfile />
                </div>
              </SidebarBody>
            </Sidebar>
          )}

          <div className="flex-1 overflow-auto transition-all duration-300 ease-in-out">
            <div className="w-full h-full">
              <div className="content-container h-full overflow-auto transition-all duration-300 ease-in-out pl-[68px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-[#1e2235] border-t-[#8A63F4] animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-[#8A63F4] animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'inicio' && (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 py-8">
                          <div className="max-w-7xl mx-auto w-full space-y-8 pb-16 px-6">
                            {/* Banner de Afiliado */}
                            <div className="w-full p-6 bg-gradient-to-r from-[#8A63F4] to-[#a47ef8] rounded-xl">
                              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="space-y-2">
                                  <h2 className="text-2xl font-semibold text-white">
                                    Indique o Clonify e se torne um Afiliado.
                                  </h2>
                                  <p className="text-white/90">
                                    Ganhe comissões recorrentes como afiliado Clonify.
                                  </p>
                                </div>
                                <Button className="bg-white hover:bg-white/90 text-[#8A63F4] font-medium px-6 py-2 rounded-full whitespace-nowrap">
                                  Torne-se nosso Parceiro Afiliado Agora!
                                </Button>
                              </div>
                            </div>

                            {/* Dashboard Header */}
                            <div className="space-y-2">
                              <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
                              <p className="text-white/70">Aqui está o resumo das suas atividades</p>
                            </div>

                            {/* Dashboard Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Total de Clonados */}
                              <GlassCard className="p-6">
                                <h3 className="text-white/70 font-medium">Total de Clonados</h3>
                                <p className="text-3xl font-semibold text-white mt-2">
                                  {savedPages.length}
                                </p>
                              </GlassCard>

                              {/* Clonar Website */}
                              <GlassCard
                                onClick={() => {
                                  handleTabChange('clonar');
                                }}
                                className="p-6 cursor-pointer group"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 text-[#8A63F4]">
                                      <svg 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                      >
                                        <path 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round" 
                                          strokeWidth={2} 
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                                        />
                                      </svg>
                                    </div>
                                    <h3 className="text-white font-medium">Clonar Website</h3>
                                  </div>
                                  <svg 
                                    className="w-5 h-5 text-white/70 transform group-hover:translate-x-1 transition-transform"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </div>
                                <p className="text-white/70 text-sm mt-1 ml-7">
                                  Comece a clonar um novo website agora mesmo
                                </p>
                              </GlassCard>
                            </div>

                            {/* Atividade Recente */}
                            <GlassCard className="p-6">
                              <h2 className="text-lg font-medium text-white mb-6">Atividade Recente</h2>
                              <div className="flex items-center justify-center py-8">
                                <div className="flex flex-col items-center gap-2 text-white/70">
                                  <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                    <svg 
                                      className="w-6 h-6"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  </div>
                                  <p>Nenhum Site Clonado!</p>
                                </div>
                              </div>
                            </GlassCard>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'clonar' && (
                      <div className="flex flex-col overflow-auto">
                        <div className="flex-1">
                          <div className="flex flex-col max-w-full w-full pb-16 px-4">
                            <div className="pt-4">
                              <StepIndicator
                                steps={[
                                  { number: 1, title: 'Clonar Site', isActive: status === STATUS.INPUT || status === STATUS.CLONING },
                                  { number: 2, title: 'Personalizar', isActive: status === STATUS.PREVIEW || status === STATUS.EDITING }
                                ]}
                              />
                            </div>

                            {status === STATUS.INPUT && (
                              <div className="flex-1 flex flex-col justify-center space-y-12 md:space-y-16 py-8">
                                {/* Título e Subtítulo */}
                                <div className="text-center space-y-3">
                                  <h1 className="text-4xl md:text-5xl font-bold text-white">Clonar Website</h1>
                                  <p className="text-lg md:text-xl text-white/70">Escolha uma das opções abaixo para começar</p>
                                </div>

                                {/* Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                  <GlassCard className="p-6">
                                    <div className="flex flex-col gap-4">
                                      <div className="w-12 h-12 rounded-lg bg-[#8A63F4]/10 flex items-center justify-center">
                                        <Download className="w-6 h-6 text-[#8A63F4]" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Download Fácil</h3>
                                        <p className="text-white/70">Baixe o código fonte do site com um clique.</p>
                                      </div>
                                    </div>
                                  </GlassCard>

                                  <GlassCard className="p-6">
                                    <div className="flex flex-col gap-4">
                                      <div className="w-12 h-12 rounded-lg bg-[#8A63F4]/10 flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-[#8A63F4]" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Clonar Rápido</h3>
                                        <p className="text-white/70">Clone sites rapidamente com nossa ferramenta otimizada.</p>
                                      </div>
                                    </div>
                                  </GlassCard>

                                  <GlassCard className="p-6">
                                    <div className="flex flex-col gap-4">
                                      <div className="w-12 h-12 rounded-lg bg-[#8A63F4]/10 flex items-center justify-center">
                                        <Copy className="w-6 h-6 text-[#8A63F4]" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Clonar Completo</h3>
                                        <p className="text-white/70">Clone o site completo incluindo assets e estilos.</p>
                                      </div>
                                    </div>
                                  </GlassCard>
                                </div>

                                {/* URL Input e Botões */}
                                <div className="max-w-full mx-auto w-full space-y-8 px-4">
                                  {/* URL Input */}
                                  <div className="space-y-4">
                                    <div className="flex flex-col space-y-2">
                                      <label htmlFor="url" className="text-white font-medium">URL do Site</label>
                                      <input
                                        type="url"
                                        id="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://exemplo.com"
                                        className="w-full px-4 py-3 rounded-lg bg-[#1e2235] text-white border border-[#8A63F4]/20 focus:border-[#8A63F4] focus:outline-none transition-colors"
                                      />
                                    </div>
                                  </div>

                                  {/* Buttons */}
                                  <div className="flex justify-center gap-4">
                                    <button 
                                      onClick={handleClone}
                                      disabled={!url.trim() || isLoading}
                                      className={`px-6 py-3 rounded-lg bg-gradient-to-r from-[#8A63F4] to-[#a47ef8] text-white font-medium transition-opacity ${
                                        !url.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                                      }`}
                                    >
                                      {isLoading ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          Clonando...
                                        </div>
                                      ) : (
                                        'Clonar Site'
                                      )}
                                    </button>
                                    <button className="px-6 py-3 rounded-lg border border-[#8A63F4] text-white font-medium hover:bg-[#8A63F4]/10 transition-colors">
                                      Importar HTML
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {status === STATUS.CLONING && (
                              <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-8">
                                <div className="w-16 h-16 rounded-full border-4 border-[#8A63F4] border-t-transparent animate-spin" />
                                <p className="text-white text-lg">Clonando site...</p>
                              </div>
                            )}

                            {status === STATUS.PREVIEW && (
                              <div className="flex-1 py-4 w-full">
                                <CloneViewer
                                  html={processedHtml}
                                  initialCss={css}
                                  technologies={technologies}
                                  incompatibleTechnologies={incompatibleTechnologies}
                                  onBack={handleBack}
                                  onEdit={handleEdit}
                                  onLightningEdit={() => setIsLightningEditorOpen(true)}
                                  onDownload={handleDownload}
                                  onError={setError}
                                />
                              </div>
                            )}

                            {status === STATUS.EDITING && (
                              <div className="h-screen p-0 w-full absolute left-0 top-0 z-10 bg-[#030617]">
                                <GrapesEditor
                                  initialHtml={processedHtml}
                                  initialCss={css}
                                  editingPageId={editingPageId}
                                  onBack={handleBackFromEditor}
                                  onSavePage={handleSavePage}
                                  onNavigate={handleTabChange}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'templates' && (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 py-8 pb-16">
                          <div className="max-w-7xl mx-auto w-full space-y-8 px-6">
                            {/* Templates content */}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'espione' && (
                      <div className="space-y-6 pt-8 px-6">
                        {/* Título da página */}
                        <div>
                          <h1 className="text-3xl font-bold text-white mb-2">Espione Anuncios</h1>
                          <p className="text-gray-400">
                            Encontre e analise anúncios de alta conversão para inspirar suas campanhas.
                          </p>
                        </div>
                        
                        {/* Container de filtros */}
                        <div className="bg-transparent border border-[#2D3748] rounded-lg p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Local */}
                            <div className="space-y-2">
                              <label className="text-white text-sm font-medium">Local</label>
                              <Select defaultValue="br" onValueChange={(value) => setSelectedCountry(value)}>
                                <SelectTrigger className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12">
                                  <SelectValue placeholder="Selecione o Local" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#151825] border-[#2D3748] text-white">
                                  <SelectItem value="br">Brasil</SelectItem>
                                  <SelectItem value="us">Estados Unidos</SelectItem>
                                  <SelectItem value="ca">Canada</SelectItem>
                                  <SelectItem value="de">Alemanha</SelectItem>
                                  <SelectItem value="fr">França</SelectItem>
                                  <SelectItem value="jp">Japão</SelectItem>
                                  <SelectItem value="gb">Reino Unido</SelectItem>
                                  <SelectItem value="au">Australia</SelectItem>
                                  <SelectItem value="cn">China</SelectItem>
                                  <SelectItem value="in">India</SelectItem>
                                  <SelectItem value="it">Italia</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                              <label className="text-white text-sm font-medium">Status</label>
                              <Select defaultValue="all" onValueChange={(value) => setSelectedStatus(value)}>
                                <SelectTrigger className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12">
                                  <SelectValue placeholder="Selecione o Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#151825] border-[#2D3748] text-white">
                                  <SelectItem value="active">Ativos</SelectItem>
                                  <SelectItem value="all">Ativos e Inativos</SelectItem>
                                  <SelectItem value="inactive">Inativos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Plataforma */}
                            <div className="space-y-2">
                              <label className="text-white text-sm font-medium">Plataforma</label>
                              <Select defaultValue="any" onValueChange={(value) => setSelectedPlatform(value)}>
                                <SelectTrigger className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12">
                                  <SelectValue placeholder="Selecione a Plataforma" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#151825] border-[#2D3748] text-white">
                                  <SelectItem value="any">Qualquer</SelectItem>
                                  <SelectItem value="fb">Facebook</SelectItem>
                                  <SelectItem value="ig">Instagram</SelectItem>
                                  <SelectItem value="tk">TikTok</SelectItem>
                                  <SelectItem value="gg">Google Ads</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Tipos de Mídia */}
                            <div className="space-y-2">
                              <label className="text-white text-sm font-medium">Tipos de Mídia</label>
                              <Select defaultValue="all" onValueChange={(value) => setSelectedMediaType(value)}>
                                <SelectTrigger className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12">
                                  <SelectValue placeholder="Selecione o Tipo" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#151825] border-[#2D3748] text-white">
                                  <SelectItem value="all">Todos os Tipos</SelectItem>
                                  <SelectItem value="image">Somente Imagens</SelectItem>
                                  <SelectItem value="video">Somente Vídeos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Idiomas */}
                            <div className="space-y-2">
                              <label className="text-white text-sm font-medium">Idiomas</label>
                              <Select defaultValue="all" onValueChange={(value) => setSelectedLanguage(value)}>
                                <SelectTrigger className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12">
                                  <SelectValue placeholder="Selecione o Idioma" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#151825] border-[#2D3748] text-white">
                                  <SelectItem value="all">Todos</SelectItem>
                                  <SelectItem value="pt">Portugues</SelectItem>
                                  <SelectItem value="en">Ingles</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Palavra-chave */}
                            <div className="space-y-2">
                              <label className="text-white text-sm font-medium">Palavra-chave</label>
                              <input 
                                type="text" 
                                placeholder="Pesquisar por palavra-chave" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyUp={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    searchFacebookAds({
                                      keyword: searchTerm,
                                      country: selectedCountry,
                                      platform: selectedPlatform,
                                      mediaType: selectedMediaType,
                                      status: selectedStatus,
                                      minActiveAds: minActiveAds
                                    });
                                  }
                                }}
                                className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12 px-4 focus:outline-none focus:border-[#8A63F4]"
                              />
                            </div>

                            {/* Data de Início */}
                            <div className="space-y-2">
                              <label className="text-white text-sm font-medium">Data de Início</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  placeholder="DD/MM/AAAA" 
                                  defaultValue="30/03/2025"
                                  className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12 pl-10 pr-4 focus:outline-none focus:border-[#8A63F4]"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8A63F4]">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Data de Término */}
                            <div className="space-y-2">
                              <label className="text-white text-sm font-medium">Data de Término</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  placeholder="DD/MM/AAAA" 
                                  defaultValue="30/04/2025"
                                  className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12 pl-10 pr-4 focus:outline-none focus:border-[#8A63F4]"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8A63F4]">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Slider e Botão */}
                            <div className="space-y-4">
                              {/* Slider */}
                              <div className="space-y-2">
                                <div className="flex flex-col gap-2">
                                  <label className="text-white text-sm font-medium">
                                    Mínimo de Anúncios Ativos: {minActiveAds}
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">1</span>
                                    <input
                                      type="range"
                                      min="1"
                                      max="100"
                                      value={minActiveAds}
                                      onChange={(e) => setMinActiveAds(Number(e.target.value))}
                                      className="w-full h-2 bg-[#2D3748] rounded-lg appearance-none cursor-pointer accent-[#8A63F4]"
                                    />
                                    <span className="text-xs text-gray-400">100</span>
                                  </div>
                                </div>
                              </div>

                              {/* Botão de Busca */}
                              <button
                                className="w-full bg-[#8A63F4] hover:bg-[#7955E8] text-white h-12 rounded-lg font-medium transition-colors flex justify-center items-center"
                                onClick={(e) => {
                                  e.preventDefault();
                                  searchFacebookAds({
                                    keyword: searchTerm,
                                    country: selectedCountry,
                                    platform: selectedPlatform,
                                    mediaType: selectedMediaType,
                                    status: selectedStatus,
                                    minActiveAds: minActiveAds
                                  });
                                }}
                                disabled={isSearching}
                              >
                                {isSearching ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Buscando...
                                  </>
                                ) : 'Buscar'}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Resultados da Pesquisa - Com efeito GlassCard */}
                        <GlassCard className="p-6" noCircuit>
                          <div className="flex justify-between items-center pb-6">
                            <h3 className="text-xl font-bold text-white">Resultados da Pesquisa</h3>
                            <span className="text-gray-400 text-sm">{searchResults.length} Anúncios encontrados</span>
                          </div>

                          {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-20">
                              <div className="w-12 h-12 border-4 border-[#8A63F4] border-t-transparent rounded-full animate-spin mb-4"></div>
                              <p className="text-gray-400">Buscando anúncios...</p>
                            </div>
                          ) : searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {searchResults.map((ad) => {
                                console.log('Renderizando ad:', ad.id, ad);
                                return (
                                  <AdCard 
                                    key={`ad-${ad.id}-${ad.ad_archive_id || ''}`} 
                                    ad={ad} 
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                              <div className="w-20 h-20 bg-[#151825]/80 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#8A63F4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                              </div>
                              <h4 className="text-lg font-medium text-white mb-2">Nenhum anúncio encontrado</h4>
                              <p className="text-gray-400 max-w-md">
                                Use os filtros acima para encontrar anúncios relevantes ou tente uma pesquisa com critérios diferentes.
                              </p>
                            </div>
                          )}
                        </GlassCard>
                      </div>
                    )}

                    {activeTab === 'clonadas' && (
                      <div className="space-y-6 pt-8">
                        <div>
                          <h2 className="text-2xl font-bold text-white">Histórico de Replicações</h2>
                          <p className="text-gray-400 mt-1">Aqui está o histórico de todas as suas páginas replicadas</p>
                          
                          {/* Campo de busca do histórico */}
                          <div className="mt-6 mb-8 relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              </svg>
                            </div>
                            <input
                              type="text"
                              placeholder="Buscar histórico..."
                              value={historySearchTerm}
                              onChange={(e) => setHistorySearchTerm(e.target.value)}
                              className="w-full h-12 pl-10 pr-4 bg-[#151825] border border-[#2D3748] rounded-lg text-white focus:outline-none focus:border-[#8A63F4] transition duration-200 cursor-[url('/cursor.svg'),_auto]"
                            />
                          </div>
                        </div>
                        
                        {/* Container da Lista */}
                        <div className="bg-transparent border border-[#2D3748] rounded-lg">
                          {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                              <div className="w-8 h-8 border-4 border-[#8A63F4] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : currentItems.length > 0 ? (
                            <>
                              {/* Lista de páginas */}
                              <div className="divide-y divide-[#2D3748]">
                                {currentItems.map((page) => (
                                  <SavedPageListItem
                                    key={page.id}
                                    page={page}
                                    onView={handleViewSavedPage}
                                    onEdit={handleEditSavedPage}
                                    onDelete={handleDeleteSavedPage}
                                  />
                                ))}
                              </div>
                              
                              {/* Paginação no final */}
                              {totalPages > 1 && (
                                <div className="flex justify-between items-center p-4 border-t border-[#2D3748]">
                                  <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 text-sm ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="15 18 9 12 15 6"></polyline>
                                    </svg>
                                    Previous
                                  </button>
                                  
                                  <div className="flex items-center gap-2">
                                    {Array.from({ length: totalPages }, (_, i) => (
                                      <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`h-8 w-8 flex items-center justify-center rounded-md text-sm ${currentPage === i + 1 ? 'bg-[#6a05ad] text-white' : 'bg-[#151825] text-gray-400 hover:bg-[#2D3748]'}`}
                                      >
                                        {i + 1}
                                      </button>
                                    ))}
                                  </div>
                                  
                                  <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 text-sm ${currentPage === totalPages ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                                  >
                                    Next
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            // Mensagem quando não há páginas salvas
                            <div className="text-center py-10 px-6">
                              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[#8A63F4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <h3 className="mt-2 text-lg font-medium text-white">Nenhuma página replicada</h3>
                              <p className="mt-1 text-sm text-gray-400">Comece clonando uma nova página para vê-la aqui.</p>
                              <div className="mt-6">
                                <Button onClick={() => handleTabChange('clonar')} className="bg-[#8A63F4] hover:bg-[#7B52E5] text-white">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                  </svg>
                                  Clonar Primeira Página
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Renderizar o Modal */}
        <LightningEditorModal
          isOpen={isLightningEditorOpen}
          onClose={() => setIsLightningEditorOpen(false)}
          htmlContent={processedHtml}
          onSaveChanges={handleLightningSave}
        />

        {/* Modal para visualização da página */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh] p-0 bg-[#1A1D2A] border-[#2D3748] cursor-[url('/cursor.svg'),_auto]">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4 border-b border-[#2D3748]">
                <DialogTitle className="text-white font-semibold text-xl truncate">
                  {currentViewPage?.title || 'Visualização da Página'}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewModalOpen(false)}
                  className="text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-0">
                {currentViewPage && (
                  <div className="w-full h-full overflow-auto">
                    <iframe
                      srcDoc={`
                        <html>
                          <head>
                            <style>${currentViewPage.css}</style>
                            <style>
                              body, html {
                                margin: 0;
                                padding: 0;
                                height: 100%;
                                overflow: auto;
                                cursor: url('/cursor.svg'), auto;
                              }
                            </style>
                          </head>
                          <body>${currentViewPage.html}</body>
                        </html>
                      `}
                      className="w-full h-full border-0"
                      title="Preview"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-[#2D3748]">
                <Button 
                  variant="outline" 
                  onClick={() => setViewModalOpen(false)}
                  className="border-[#3d435a] text-white hover:bg-[#2d3348]"
                >
                  Fechar
                </Button>
                <Button 
                  variant="default"
                  onClick={() => {
                    if (currentViewPage) {
                      setViewModalOpen(false);
                      handleEditSavedPage(currentViewPage);
                    }
                  }}
                  className="bg-[#8A63F4] hover:bg-[#7B52E5]"
                >
                  Editar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Error Message (completo) */}
        {error && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
              <strong className="font-bold">Erro: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        )}
      </main>
    </>
  );
}