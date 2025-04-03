import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  let browser = null;
  
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

    // Adicionar protocolo se necessário
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Iniciar o Puppeteer
    console.log('[API Route Crawler] Iniciando Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Configurar timeout maior para sites lentos
    await page.setDefaultNavigationTimeout(60000);
    await page.setDefaultTimeout(60000);

    // Configurar user agent para evitar bloqueios
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
    
    console.log(`[API Route Crawler] Navegando para ${targetUrl}...`);
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    console.log('[API Route Crawler] Página carregada, obtendo conteúdo...');
    const htmlFromPuppeteer = await page.content();

    // Processar o HTML com Cheerio para extrair recursos
    const $ = cheerio.load(htmlFromPuppeteer);
    const baseUrl = new URL(targetUrl).origin;

    // Coletar links de CSS
    const cssLinks = Array.from($('link[rel="stylesheet"]').map((_, el) => {
      const href = $(el).attr('href');
      if (!href) return null;
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
    })).flat().filter(Boolean) as string[];

    console.log(`[API Route Crawler] HTML processado e recursos extraídos para ${targetUrl}`);

    return NextResponse.json({
      html: htmlFromPuppeteer,
      url: targetUrl,
      baseUrl,
      resources: {
        css: cssLinks,
        js: scriptLinks,
        images: imageLinks
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API Route Crawler] Erro ao processar requisição:', error);

    let originalUrl = 'URL desconhecida';
    try {
      const body = await request.json();
      originalUrl = body.url || originalUrl;
      if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
        originalUrl = 'https://' + originalUrl;
      }
    } catch (parseError) {
      console.error("Erro ao parsear body para fallback:", parseError);
    }

    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erro ao Clonar - ${originalUrl}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
          h1 { color: #cc0000; }
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

          <p>Por favor, verifique a URL ou tente novamente mais tarde. Se o problema persistir, o site pode estar bloqueando a clonagem.</p>
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
      isFailback: true,
      error: error instanceof Error ? error.message : 'Erro interno ao processar a requisição'
    },
    { status: 500 }
    );
  } finally {
    if (browser) {
      console.log('[API Route Crawler] Fechando Puppeteer...');
      await browser.close();
      console.log('[API Route Crawler] Puppeteer fechado.');
    }
  }
}

function resolveUrl(url: string, baseUrl: string, pageUrl: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    return new URL(url, pageUrl).toString();
  } catch (e) {
    console.warn(`[resolveUrl] Falha ao resolver URL: "${url}" com base "${pageUrl}". Erro: ${e}`);
    return url;
  }
} 