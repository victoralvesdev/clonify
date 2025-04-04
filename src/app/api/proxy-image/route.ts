import { NextRequest, NextResponse } from 'next/server';

// Configurar opções de runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const imageUrl = request.nextUrl.searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('URL não fornecida', { status: 400 });
    }

    // Validar se a URL é válida
    try {
      new URL(imageUrl);
    } catch (error) {
      return new NextResponse('URL inválida', { status: 400 });
    }

    // Validar se a URL aponta para uma imagem (simplificado)
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const hasValidExtension = imageExtensions.some(ext => 
      imageUrl.toLowerCase().endsWith(`.${ext}`)
    );

    if (!hasValidExtension) {
      return new NextResponse('URL não aponta para uma imagem', { status: 400 });
    }

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return new NextResponse('Falha ao buscar imagem', { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
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
    return new NextResponse('Erro ao processar imagem', { status: 500 });
  }
} 