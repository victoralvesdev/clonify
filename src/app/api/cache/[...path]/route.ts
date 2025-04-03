import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  try {
    const filePath = join(process.cwd(), 'public', 'cache', ...context.params.path);
    
    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse('Asset não encontrado', { status: 404 });
    }

    // Ler o arquivo
    const file = await fs.readFile(filePath);
    
    // Determinar o content-type
    const extension = filePath.split('.').pop()?.toLowerCase();
    const contentType = getContentType(extension);

    // Retornar o arquivo com o content-type apropriado
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
      },
    });
  } catch (error) {
    console.error('Erro ao servir asset:', error);
    return new NextResponse('Erro ao servir asset', { status: 500 });
  }
}

function getContentType(extension?: string): string {
  const types: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'css': 'text/css',
    'js': 'application/javascript',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  };
  
  return types[extension || ''] || 'application/octet-stream';
} 