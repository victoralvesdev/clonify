import { NextResponse } from 'next/server';
import { join } from 'path';
import fs from 'fs/promises';

// Limpar arquivos mais antigos que 7 dias
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export async function POST() {
  try {
    const cacheDir = join(process.cwd(), 'public', 'cache');
    
    // Verificar se o diretório existe
    try {
      await fs.access(cacheDir);
    } catch {
      return NextResponse.json({ message: 'Diretório de cache não encontrado' });
    }

    // Listar todos os arquivos
    const files = await fs.readdir(cacheDir);
    const now = Date.now();
    let deletedCount = 0;

    // Remover arquivos antigos
    for (const file of files) {
      const filePath = join(cacheDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtimeMs > MAX_AGE) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    return NextResponse.json({
      message: `Cache limpo com sucesso. ${deletedCount} arquivos removidos.`
    });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar cache' },
      { status: 500 }
    );
  }
} 