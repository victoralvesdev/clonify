import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface CacheConfig {
  directory: string;
}

export interface CachedAsset {
  hash: string;
  mimeType: string;
  data: Buffer;
}

export class AssetCache {
  private cacheDir: string;

  constructor(config: CacheConfig) {
    console.log('Inicializando AssetCache com diretório:', config.directory);
    this.cacheDir = config.directory;
    this.ensureCacheDirectory();
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.access(this.cacheDir);
      console.log('Diretório de cache existe');
    } catch (error) {
      console.log('Criando diretório de cache...');
      await fs.mkdir(this.cacheDir, { recursive: true, mode: 0o755 });
    }

    // Verificar e corrigir permissões
    try {
      const stats = await fs.stat(this.cacheDir);
      const mode = stats.mode & 0o777;
      if (mode !== 0o755) {
        console.log('Corrigindo permissões do diretório de cache...');
        await fs.chmod(this.cacheDir, 0o755);
      }
    } catch (error) {
      console.error('Erro ao verificar/corrigir permissões:', error);
    }
  }

  async store(url: string, data: Buffer, mimeType: string): Promise<CachedAsset> {
    console.log(`Armazenando asset: ${url}`);
    await this.ensureCacheDirectory();

    const hash = crypto.createHash('md5').update(url).digest('hex');
    const ext = this.getExtensionFromMimeType(mimeType);
    const filename = `${hash}${ext}`;
    const localPath = path.join(this.cacheDir, filename);

    try {
      await fs.writeFile(localPath, data, { mode: 0o644 });
      console.log(`Asset armazenado com sucesso: ${localPath}`);
    } catch (error: any) {
      console.error('Erro ao escrever arquivo:', error);
      
      // Tentar criar o diretório novamente se não existir
      if (error.code === 'ENOENT') {
        await this.ensureCacheDirectory();
        await fs.writeFile(localPath, data, { mode: 0o644 });
      } else {
        throw new Error(`Falha ao armazenar asset: ${error.message}`);
      }
    }

    return {
      hash,
      mimeType,
      data
    };
  }

  async retrieve(url: string): Promise<CachedAsset | null> {
    console.log(`Buscando asset: ${url}`);
    await this.ensureCacheDirectory();

    const hash = crypto.createHash('md5').update(url).digest('hex');
    
    try {
      const files = await fs.readdir(this.cacheDir);
      const cachedFile = files.find(file => file.startsWith(hash));

      if (!cachedFile) {
        console.log('Asset não encontrado no cache');
        return null;
      }

      const localPath = path.join(this.cacheDir, cachedFile);
      
      try {
        await fs.access(localPath, fs.constants.R_OK);
      } catch (error) {
        console.error('Arquivo existe mas não pode ser lido:', error);
        return null;
      }

      const mimeType = this.getMimeTypeFromExtension(path.extname(cachedFile));
      console.log(`Asset encontrado: ${localPath}`);

      const data = await fs.readFile(localPath);

      return {
        hash,
        mimeType,
        data
      };
    } catch (error) {
      console.error('Erro ao recuperar asset:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)).catch(error => {
          console.error(`Erro ao deletar arquivo ${file}:`, error);
        }))
      );
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'text/css': '.css',
      'text/javascript': '.js',
      'application/javascript': '.js'
    };

    return mimeToExt[mimeType] || '';
  }

  private getMimeTypeFromExtension(ext: string): string {
    const extToMime: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.css': 'text/css',
      '.js': 'application/javascript'
    };

    return extToMime[ext] || 'application/octet-stream';
  }
} 