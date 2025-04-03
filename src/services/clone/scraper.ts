import puppeteer, { Browser, Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import sharp from 'sharp';
import { AssetCache, CacheConfig } from '@/services/cache/assetCache';
import { ScrapedAsset, ScrapedData } from './types';
import path from 'path';
import fs from 'fs/promises';

const MAX_RETRIES = 3;
const TIMEOUT = 60000; // 60 segundos

export class WebScraper {
  private assetCache: AssetCache;
  private assets: ScrapedAsset[];
  private browser: Browser | null = null;

  constructor(cacheConfig: CacheConfig) {
    console.log('Inicializando WebScraper com config:', cacheConfig);
    this.assetCache = new AssetCache({ directory: cacheConfig.directory });
    this.assets = [];
  }

  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
      } catch (error) {
        console.error('Erro ao fechar o browser:', error);
      }
    }
  }

  async scrape(url: string): Promise<ScrapedData> {
    console.log('Iniciando scrape da URL:', url);
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Tentativa ${attempt} de ${MAX_RETRIES}`);
        
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
          ]
        }).catch(error => {
          console.error('Erro ao iniciar o browser:', error);
          throw error;
        });

        try {
          console.log('Browser iniciado com sucesso');
          const page: Page = await this.browser.newPage();
          
          // Configurar timeout maior
          await page.setDefaultNavigationTimeout(TIMEOUT);
          await page.setDefaultTimeout(TIMEOUT);
          
          this.assets = [];

          await page.setRequestInterception(true);

          page.on('request', async (request) => {
            try {
              await this.interceptRequest(request);
            } catch (error) {
              console.error('Erro na interceptação de requisição:', error);
              await request.continue().catch(console.error);
            }
          });

          console.log('Navegando para a URL...');
          await page.goto(url, { 
            waitUntil: 'networkidle0',
            timeout: TIMEOUT
          });
          
          console.log('Página carregada, obtendo conteúdo...');
          const html = await page.content();

          return { 
            html, 
            assets: this.assets, 
            baseUrl: new URL(url).origin 
          };
        } finally {
          console.log('Fechando browser...');
          await this.close();
        }
      } catch (error: any) {
        console.error(`Erro na tentativa ${attempt}:`, error);
        lastError = error;
        
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Falha após ${MAX_RETRIES} tentativas. Último erro: ${lastError?.message}`);
  }

  private async interceptRequest(request: HTTPRequest): Promise<void> {
    const resourceType = request.resourceType();
    const url = request.url();

    // Ignorar recursos que não são assets
    if (!['image', 'stylesheet', 'font'].includes(resourceType)) {
      await request.continue();
      return;
    }

    try {
      console.log(`Interceptando ${resourceType} de ${url}`);
      
      // Tentar recuperar do cache
      const cachedAsset = await this.assetCache.retrieve(url);
      
      if (cachedAsset) {
        console.log(`Asset encontrado no cache: ${url}`);
        
        // Adicionar à lista de assets se ainda não estiver presente
        if (!this.assets.find(a => a.hash === cachedAsset.hash)) {
          this.assets.push({
            url,
            hash: cachedAsset.hash,
            mimeType: cachedAsset.mimeType
          });
        }

        // Responder com o asset do cache
        await request.respond({
          status: 200,
          headers: {
            'content-type': cachedAsset.mimeType
          },
          body: cachedAsset.data
        });
        return;
      }

      // Se não estiver no cache, fazer o download
      console.log(`Baixando asset: ${url}`);
      await request.continue();
      const response = await request.response();
      
      if (!response) {
        console.warn(`Sem resposta para ${url}`);
        return;
      }

      const buffer = await response.buffer();
      const mimeType = response.headers()['content-type'] || '';

      // Armazenar no cache
      const storedAsset = await this.assetCache.store(url, buffer, mimeType);
      
      // Adicionar à lista de assets
      this.assets.push({
        url,
        hash: storedAsset.hash,
        mimeType: storedAsset.mimeType
      });

    } catch (error) {
      console.error(`Erro ao processar asset ${url}:`, error);
      await request.continue().catch(console.error);
    }
  }
}