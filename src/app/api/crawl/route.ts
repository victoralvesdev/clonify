import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        // Validação básica da URL
        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL inválida ou não fornecida.' },
                { status: 400 }
            );
        }

        console.log(`[API] Recebida requisição para clonar: ${url}`);
        let browser = null;

        try {
            console.log('[API] Iniciando Puppeteer...');
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled'
                ]
            });

            const page = await browser.newPage();

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
            await page.setViewport({ width: 1366, height: 768 });

            console.log(`[API] Navegando para ${url}...`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

            console.log('[API] Página carregada. Extraindo HTML renderizado...');
            const htmlContent = await page.content();

            console.log(`[API] HTML extraído com sucesso (Tamanho: ${htmlContent.length} caracteres).`);

            return NextResponse.json({ html: htmlContent });

        } catch (error) {
            console.error('[API] Erro durante a clonagem via Puppeteer:', error);
            let errorMessage = 'Falha ao clonar a página.';
            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    errorMessage = 'Tempo limite excedido ao carregar a página. O site pode ser muito lento ou complexo.';
                } else {
                    errorMessage = error.message;
                }
            }
            return NextResponse.json({ error: errorMessage }, { status: 500 });

        } finally {
            if (browser) {
                console.log('[API] Fechando Puppeteer...');
                await browser.close();
                console.log('[API] Puppeteer fechado.');
            }
        }
    } catch (error) {
        console.error('[API] Erro ao processar requisição:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        );
    }
} 