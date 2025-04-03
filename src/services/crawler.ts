import axios from 'axios';
import { load } from 'cheerio';

interface CrawlerResult {
  html: string;
  technologies: string[];
  resources: {
    css: Array<{url: string, content: string}>;
    js: Array<{url: string, content: string}>;
    images: string[];
  };
  baseUrl: string;
}

// Função para reescrever URLs relativas dentro de um bloco CSS
const rewriteCssUrls = (cssContent: string, cssBaseUrl: string): string => {
    // Regex para encontrar url(...) com caminhos relativos (não começando com http, https, data:, /) ou absolutos (/)
    const urlRegex = /url\((?!['\"]?(?:https?:|data:|ftp:|#|\/\/))(['\"]?)([^)\'\"]+)\1\)/g;
    let siteOrigin = '';
    try {
        siteOrigin = new URL(cssBaseUrl).origin;
    } catch (e) {
        console.warn(`[CSS Rewriter] Não foi possível extrair a origem de: ${cssBaseUrl}`);
        return cssContent; // Retorna original se a base for inválida
    }

    return cssContent.replace(urlRegex, (match, quote, urlPath) => {
        try {
            // Remove espaços em branco extras que podem quebrar a URL
            const cleanedUrlPath = urlPath.trim();
            // Cria a URL absoluta baseada na URL do arquivo CSS
            const absoluteUrl = new URL(cleanedUrlPath, cssBaseUrl).toString();
            console.log(`[CSS Rewriter] URL reescrita: ${cleanedUrlPath} -> ${absoluteUrl}`);
            return `url(${quote}${absoluteUrl}${quote})`;
        } catch (e) {
            console.warn(`[CSS Rewriter] Não foi possível resolver URL relativa: ${urlPath} em ${cssBaseUrl}`);
            return match; // Retorna o original se houver erro
        }
    });
};

// Função para extrair CSS
const extractCss = async (html: string, baseUrl: string): Promise<string> => {
  console.log('[Frontend] Extraindo CSS do HTML recebido...');
  const $ = load(html);
  let css = '';
  const cssPromises: Promise<void>[] = [];

  // 1. Extrair <style> tags
  $('style').each((_, element) => {
    // Tentar reescrever URLs mesmo em estilos inline (usando baseUrl como base)
    const styleContent = $(element).html() || '';
    css += rewriteCssUrls(styleContent, baseUrl); // Usar baseUrl como base
    css += '\n';
  });

  // 2. Extrair links <link rel="stylesheet">
  $('link[rel="stylesheet"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      let absoluteUrl = '';
      try {
         // Garante que a URL do link seja absoluta
         absoluteUrl = new URL(href, baseUrl).toString();
      } catch(e) {
         console.warn(`[Frontend] URL de link CSS inválida: ${href}`);
         return; // Pula este link
      }
      
      console.log(`[Frontend] Encontrado link CSS: ${absoluteUrl}`);
      // Adicionar promessa para buscar e reescrever o conteúdo do CSS
      cssPromises.push(
        axios.get(absoluteUrl, { timeout: 15000 }) // Timeout de 15s para buscar CSS
          .then(response => {
            console.log(`[Frontend] CSS de ${absoluteUrl} carregado.`);
            // Reescrever URLs relativas DENTRO do CSS baixado, usando a URL do arquivo CSS como base
            const rewrittenContent = rewriteCssUrls(response.data, absoluteUrl);
            css += rewrittenContent;
            css += '\n';
          })
          .catch(error => {
            // Não adiciona nada se falhar
            console.warn(`[Frontend] Falha ao carregar/processar CSS de ${absoluteUrl}: ${error.message}`);
          })
      );
    }
  });

  // Esperar todas as buscas de CSS terminarem
  try {
    await Promise.all(cssPromises);
    console.log(`[Frontend] Extração e processamento de CSS externo concluídos (Tamanho acumulado: ${css.length}).`);
  } catch (error) {
    console.error('[Frontend] Erro ao aguardar buscas/processamento de CSS:', error);
  }

  return css;
};

// Função hipotética para detectar tecnologias (manter sua lógica atual aqui)
const detectTechnologies = (html: string): { technologies: string[], incompatibleTechnologies: string[] } => {
   console.log('[Frontend] Detectando tecnologias...');
   // Simples exemplo: procurar por 'react', 'vue', 'angular', 'elementor'
   const technologies: string[] = [];
   const incompatibleTechnologies: string[] = [];

   if (html.toLowerCase().includes('react')) technologies.push('React');
   if (html.toLowerCase().includes('vue')) technologies.push('Vue.js');
   if (html.toLowerCase().includes('angular')) technologies.push('Angular');
   if (html.toLowerCase().includes('elementor')) technologies.push('Elementor');
   if (html.toLowerCase().includes('wordpress') || html.toLowerCase().includes('wp-')) technologies.push('WordPress');

   // Exemplo de incompatibilidade (poderia ser baseado em scripts específicos)
   // if (html.includes('some-complex-framework.js')) incompatibleTechnologies.push('Framework Complexo X');

   console.log(`[Frontend] Tecnologias detectadas: ${technologies.join(', ') || 'Nenhuma'}`);
   console.log(`[Frontend] Incompatibilidades potenciais: ${incompatibleTechnologies.join(', ') || 'Nenhuma'}`);
   return { technologies, incompatibleTechnologies };
};

// URL da API do Backend (ler da variável de ambiente ou usar default)
const BACKEND_API_URL = '/api/crawler';

interface CrawlResult {
    html: string;
    css: string;
    technologies: string[];
    incompatibleTechnologies: string[];
}

export const crawlPage = async (targetUrl: string): Promise<CrawlResult> => {
    console.log(`[Frontend] Solicitando clonagem para: ${targetUrl}`);
    try {
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: targetUrl }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.html) {
            throw new Error('Resposta da API inválida ou sem HTML.');
        }

        const processedHtml = data.html;
        console.log(`[Frontend] HTML recebido da API (Tamanho: ${processedHtml.length}).`);

        // Extrair CSS e tecnologias a partir do HTML recebido
        const css = await extractCss(processedHtml, targetUrl); 
        const { technologies, incompatibleTechnologies } = detectTechnologies(processedHtml); 

        console.log('[Frontend] Processamento finalizado no frontend.');

        return {
            html: processedHtml,
            css: css,
            technologies: technologies,
            incompatibleTechnologies: incompatibleTechnologies,
        };
    } catch (error: any) {
        console.error('[Frontend] Erro ao chamar API de clonagem:', error);
        throw new Error(error.message || 'Falha ao clonar a página');
    }
};

function resolveUrl(url: string | undefined, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  // Resolver a URL completa primeiro
  let fullUrl = url;
  if (url.startsWith('//')) {
    fullUrl = `https:${url}`;
  } else if (!url.startsWith('http')) {
    fullUrl = new URL(url, baseUrl).toString();
  }
  
  return fullUrl;
} 