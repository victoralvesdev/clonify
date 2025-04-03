import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      console.error('URL não fornecida');
      return new NextResponse('URL não fornecida', { status: 400 });
    }

    // Validar se a URL é válida
    try {
      new URL(imageUrl);
    } catch (error) {
      console.error('URL inválida:', imageUrl);
      return new NextResponse('URL inválida', { status: 400 });
    }

    // Validar se a URL aponta para uma imagem
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl)) {
      console.error('URL não aponta para uma imagem:', imageUrl);
      return new NextResponse('URL não aponta para uma imagem', { status: 400 });
    }

    console.log('Buscando imagem:', imageUrl);
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error('Falha ao buscar imagem:', response.status, response.statusText);
      return new NextResponse('Falha ao buscar imagem', { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('Tipo de conteúdo inválido:', contentType);
      return new NextResponse('Tipo de conteúdo inválido', { status: 400 });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Erro ao fazer proxy da imagem:', error);
    return new NextResponse('Erro ao processar imagem', { status: 500 });
  }
} 