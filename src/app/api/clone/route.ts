import { NextResponse } from 'next/server';
import { WebScraper } from '@/services/clone/scraper';
import { CacheConfig } from '@/services/cache/assetCache';
import path from 'path';

const cacheConfig: CacheConfig = {
  directory: path.join(process.cwd(), 'public', 'cache')
};

export async function POST(request: Request) {
  let scraper: WebScraper | null = null;

  try {
    console.log('Iniciando requisição de clonagem...');
    
    // Validar o corpo da requisição
    const body = await request.json().catch(() => {
      console.error('Erro ao parsear JSON do corpo da requisição');
      throw new Error('Corpo da requisição inválido');
    });
    
    console.log('Corpo da requisição:', body);

    const { url } = body;

    if (!url) {
      console.error('URL não fornecida');
      return NextResponse.json(
        { error: 'URL é obrigatória' },
        { status: 400 }
      );
    }

    // Validar formato da URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      console.log('URL validada:', parsedUrl.toString());
    } catch (error) {
      console.error('URL inválida:', url, error);
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      );
    }

    // Verificar se o diretório de cache existe e tem permissões corretas
    console.log('Verificando diretório de cache:', cacheConfig.directory);
    
    scraper = new WebScraper(cacheConfig);

    console.log('Iniciando scraping da URL:', parsedUrl.toString());
    const scrapedData = await scraper.scrape(parsedUrl.toString());
    console.log('Scraping concluído com sucesso');

    // Processar os assets para usar caminhos públicos
    const processedAssets = scrapedData.assets.map(asset => ({
      ...asset,
      publicPath: `/cache/${asset.hash}`
    }));

    return NextResponse.json({
      html: scrapedData.html,
      assets: processedAssets,
      baseUrl: scrapedData.baseUrl
    });

  } catch (error: any) {
    console.error('Erro durante o processo de clonagem:', error);
    
    // Determinar o status code apropriado
    let status = 500;
    let errorMessage = 'Erro ao clonar a página';

    if (error.message?.includes('ENOTFOUND')) {
      status = 404;
      errorMessage = 'Site não encontrado';
    } else if (error.message?.includes('timeout')) {
      status = 504;
      errorMessage = 'Tempo limite excedido ao tentar acessar o site';
    } else if (error.message?.includes('EACCES')) {
      status = 500;
      errorMessage = 'Erro de permissão ao acessar o cache';
    } else if (error.message?.includes('net::ERR_CERT_')) {
      status = 502;
      errorMessage = 'Erro de certificado SSL ao acessar o site';
    }

    return NextResponse.json({
      error: errorMessage,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status });

  } finally {
    if (scraper) {
      try {
        await scraper.close();
      } catch (error) {
        console.error('Erro ao fechar o scraper:', error);
      }
    }
  }
} 