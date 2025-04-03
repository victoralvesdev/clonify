import { NextRequest, NextResponse } from 'next/server';
// import { JSDOM } from 'jsdom'; // JSDOM não é mais necessário aqui diretamente
import * as cheerio from 'cheerio';

// URL do backend Express que executa o Puppeteer
// Idealmente, usar variável de ambiente: process.env.BACKEND_API_URL || 'http://localhost:3001'
const BACKEND_CRAWL_URL = 'http://localhost:3001/api/crawl';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL é obrigatória' },
        { status: 400 }
      );
    }

    console.log(`[API Route Crawler] Recebida requisição para ${url}`);

    // Adicionar protocolo se necessário (backend também faz isso, mas bom garantir)
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    let htmlFromPuppeteer = '';
    let backendError = null;

    try {
      console.log(`[API Route Crawler] Chamando backend Express em ${BACKEND_CRAWL_URL} para ${targetUrl}`);
      // Fazer a requisição POST para o backend Express/Puppeteer
      const backendResponse = await fetch(BACKEND_CRAWL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
        // Definir um timeout para a chamada ao backend (ex: 2 minutos)
        // Isso requer AbortController, um pouco mais complexo, adicionando depois se necessário.
        // Por agora, confiaremos no timeout do backend e do fetch padrão.
         next: { revalidate: 0 } // Não cachear esta chamada de API
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({ error: 'Falha ao ler resposta de erro do backend.' }));
        throw new Error(`Backend retornou erro ${backendResponse.status}: ${errorData.error || backendResponse.statusText}`);
      }

      const backendData = await backendResponse.json();

      if (!backendData.html) {
        throw new Error('Backend não retornou HTML.');
      }

      htmlFromPuppeteer = backendData.html;
      console.log(`[API Route Crawler] HTML recebido do backend com sucesso. Tamanho: ${htmlFromPuppeteer.length} caracteres`);

    } catch (error) {
      console.error(`[API Route Crawler] Erro ao chamar ou processar resposta do backend Express (${targetUrl}):`, error);
      backendError = error; // Guardar o erro para o fallback
      // Não lançar erro aqui ainda, vamos tentar o fallback se htmlFromPuppeteer estiver vazio
    }

    // Se a chamada ao backend falhou E não temos HTML, usar o fallback
    if (!htmlFromPuppeteer && backendError) {
       console.warn(`[API Route Crawler] Usando fallback HTML para ${targetUrl} devido a erro no backend.`);
       // O HTML de fallback é gerado mais abaixo no bloco catch principal
       // Por agora, lançamos o erro para que o catch externo o capture e gere o fallback.
        throw backendError;
    } else if (!htmlFromPuppeteer && !backendError) {
        // Caso estranho: backend retornou 200 OK mas sem HTML
        throw new Error("Backend retornou sucesso mas sem conteúdo HTML.");
    }


    // Agora processar o HTML recebido do Puppeteer com Cheerio para extrair recursos
    const $ = cheerio.load(htmlFromPuppeteer);
    const baseUrl = new URL(targetUrl).origin; // Usar a URL original para base

    // Coletar links de CSS
    const cssLinks = Array.from($('link[rel="stylesheet"]').map((_, el) => {
      const href = $(el).attr('href');
      if (!href) return null;
      // Resolver URL relativa ao baseUrl obtido da página original
      return resolveUrl(href, baseUrl, targetUrl);
    })).filter(Boolean) as string[];

    // Coletar scripts
    const scriptLinks = Array.from($('script[src]').map((_, el) => {
      const src = $(el).attr('src');
      if (!src) return null;
      return resolveUrl(src, baseUrl, targetUrl);
    })).filter(Boolean) as string[];

    // Coletar imagens
    const imageLinks = Array.from($('img[src]').map((_, el) => {
      const src = $(el).attr('src');
      // Considerar também srcset para imagens responsivas
      const srcset = $(el).attr('srcset');
      let urls = [];
      if (src) urls.push(resolveUrl(src, baseUrl, targetUrl));
      if (srcset) {
         urls = urls.concat(srcset.split(',').map(part => {
             const urlPart = part.trim().split(' ')[0];
             return resolveUrl(urlPart, baseUrl, targetUrl);
         }));
      }
      return urls;
    })).flat().filter(Boolean) as string[]; // Achatamos e filtramos

    // --- Opcional: Modificar o HTML para usar o proxy ---
    // Se o objetivo for servir os assets através do seu /api/proxy
    // você precisaria reescrever os atributos src/href aqui.
    // Exemplo (simplificado, pode precisar de ajustes):
    /*
    $('link[rel="stylesheet"]').each((_, el) => {
        const originalHref = $(el).attr('href');
        if (originalHref && !originalHref.startsWith('data:')) {
            const resolvedUrl = resolveUrl(originalHref, baseUrl, targetUrl);
            $(el).attr('href', `/api/proxy?url=${encodeURIComponent(resolvedUrl)}&type=css`);
        }
    });
    $('script[src]').each((_, el) => {
        const originalSrc = $(el).attr('src');
        if (originalSrc && !originalSrc.startsWith('data:')) {
             const resolvedUrl = resolveUrl(originalSrc, baseUrl, targetUrl);
            $(el).attr('src', `/api/proxy?url=${encodeURIComponent(resolvedUrl)}&type=js`);
        }
    });
     $('img').each((_, el) => {
        const originalSrc = $(el).attr('src');
        if (originalSrc && !originalSrc.startsWith('data:')) {
             const resolvedUrl = resolveUrl(originalSrc, baseUrl, targetUrl);
            $(el).attr('src', `/api/proxy?url=${encodeURIComponent(resolvedUrl)}&type=image`);
        }
        // Precisaria tratar srcset também
    });
    */
    // Por enquanto, vamos retornar o HTML como veio do puppeteer,
    // e as URLs absolutas dos recursos para o frontend decidir como usar.
    // O frontend já parece chamar /api/proxy para buscar CSS/JS.

    // Obter o HTML final (ainda com URLs originais, mas absolutas se processadas por resolveUrl)
    // Se a reescrita acima fosse feita, $.html() conteria as URLs do proxy.
    const finalHtml = $.html();

    console.log(`[API Route Crawler] HTML processado e recursos extraídos para ${targetUrl}`);

    return NextResponse.json({
      html: finalHtml, // Retorna o HTML recebido do Puppeteer
      url: targetUrl,
      baseUrl,
      resources: {
        css: cssLinks,
        js: scriptLinks,
        images: imageLinks // Retorna lista de URLs absolutas das imagens
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) { // Captura erros da chamada ao backend OU do processamento cheerio
    console.error('[API Route Crawler] Erro geral no processo de crawl:', error);

    // Tentativa de obter a URL original para o fallback
    let originalUrl = 'URL desconhecida';
    try {
        const body = await request.json(); // Tentar ler o body novamente se falhou antes
        originalUrl = body.url || originalUrl;
        if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
             originalUrl = 'https://' + originalUrl;
        }
    } catch (parseError) {
        console.error("Erro ao parsear body para fallback:", parseError);
    }


    // Usar o HTML de fallback como antes
    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erro ao Clonar - ${originalUrl}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
          h1 { color: #cc0000; } /* Cor diferente para erro */
          .site-url { color: #0066cc; word-break: break-all; }
          .error-box { background: #fff5f5; border: 1px solid #ffcccc; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Erro ao Clonar Site</h1>
          <p>Não foi possível obter o conteúdo do site:</p>
          <p class="site-url">${originalUrl}</p>

          <div class="error-box">
            <p><strong>Detalhes do Erro:</strong></p>
            <p>${error instanceof Error ? error.message : 'Erro interno desconhecido'}</p>
          </div>

          <p>Por favor, verifique a URL ou tente novamente mais tarde. Se o problema persistir, o site pode estar bloqueando a clonagem ou o serviço de backend pode estar indisponível.</p>
        </div>
      </body>
      </html>
    `;

    return NextResponse.json({
      html: fallbackHtml,
      url: originalUrl,
      baseUrl: originalUrl ? new URL(originalUrl).origin : '',
      resources: {
        css: [],
        js: [],
        images: []
      },
      timestamp: new Date().toISOString(),
      isFailback: true, // Indica que é um fallback
      error: error instanceof Error ? error.message : 'Erro interno ao processar a requisição'
    },
    { status: 500 } // Retorna status 500 para indicar erro no servidor
    );
  }
}

// Função para resolver URLs relativas para absolutas (mantida)
// ... (a função resolveUrl existente permanece aqui) ...
function resolveUrl(url: string, baseUrl: string, pageUrl: string): string {
  if (!url) return '';

  // Ignorar URLs de dados
  if (url.startsWith('data:')) return url;

  // Converter URLs relativas para absolutas
  try {
    // Usar construtor URL para tratamento robusto
    // new URL(path, base)
    return new URL(url, pageUrl).toString();
  } catch (e) {
     // Se falhar (ex: URL inválida como "javascript:void(0)"), retorna a original ou string vazia
     console.warn(`[resolveUrl] Falha ao resolver URL: "${url}" com base "${pageUrl}". Erro: ${e}`);
     return url; // Ou retornar '' se preferir ignorar URLs inválidas
  }
} 