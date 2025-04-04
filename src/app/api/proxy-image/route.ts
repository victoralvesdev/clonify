import { NextRequest, NextResponse } from 'next/server';

// Configurar opções de runtime
export const runtime = 'edge';

// Função auxiliar para verificar se uma URL é válida
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

// Função auxiliar para verificar se é uma imagem
function isImageUrl(url: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  return imageExtensions.some(ext => url.toLowerCase().endsWith(`.${ext}`));
}

export async function GET(request: NextRequest) {
  try {
    const imageUrl = request.nextUrl.searchParams.get('url');

    if (!imageUrl || !isValidUrl(imageUrl)) {
      return new Response('URL inválida ou não fornecida', { status: 400 });
    }

    if (!isImageUrl(imageUrl)) {
      return new Response('URL não aponta para uma imagem', { status: 400 });
    }

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return new Response('Falha ao buscar imagem', { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return new Response('Tipo de conteúdo inválido', { status: 400 });
    }

    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch {
    return new Response('Erro ao processar imagem', { status: 500 });
  }
} 