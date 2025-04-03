import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { html, url } = await request.json();

    if (!html || !url) {
      return NextResponse.json(
        { error: 'HTML e URL são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar um nome de arquivo baseado na URL
    const fileName = url
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 50);

    // Caminho para a pasta de cache
    const cachePath = path.join(process.cwd(), 'public', 'cache');

    // Garantir que a pasta existe
    await fs.mkdir(cachePath, { recursive: true });

    // Salvar o arquivo
    const filePath = path.join(cachePath, `${fileName}.html`);
    await fs.writeFile(filePath, html, 'utf-8');

    return NextResponse.json(
      { success: true, message: 'Página salva com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao salvar página:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar a página' },
      { status: 500 }
    );
  }
} 