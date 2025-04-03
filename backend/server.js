const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
// Usar variável de ambiente ou default para porta do backend
const PORT = process.env.BACKEND_PORT || 3001;
// Usar variável de ambiente ou default para URL do frontend (para CORS)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Configuração do CORS para permitir requisições apenas do frontend
app.use(cors({ origin: FRONTEND_URL }));

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Endpoint da API para clonagem
app.post('/api/crawl', async (req, res) => {
    const { url } = req.body;

    // Validação básica da URL
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL inválida ou não fornecida.' });
    }

    console.log(`[Backend] Recebida requisição para clonar: ${url}`);
    let browser = null; // Manter referência para fechar no finally

    try {
        console.log('[Backend] Iniciando Puppeteer...');
        browser = await puppeteer.launch({
            headless: true, // Recomenda-se 'new' nas versões mais recentes, mas true é mais compatível
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                // Opcional: ajuda com alguns sites que detectam automação
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();

        // Opcional: Emular um dispositivo/user-agent comum
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
        // Opcional: Configurar viewport
        await page.setViewport({ width: 1366, height: 768 });

        console.log(`[Backend] Navegando para ${url}...`);
        // Navegar para a URL. networkidle2 espera até que haja pouca atividade de rede,
        // o que geralmente significa que o JS inicial terminou de carregar recursos.
        // Timeout aumentado para 90 segundos para sites complexos/lentos.
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

        console.log('[Backend] Página carregada. Extraindo HTML renderizado...');

        // Opcional: Esperar um tempo fixo adicional pode ajudar em sites com animações pós-load
        // await new Promise(resolve => setTimeout(resolve, 1500));

        // Obter o conteúdo HTML completo da página após a renderização e execução do JS
        const htmlContent = await page.content();

        console.log(`[Backend] HTML extraído com sucesso (Tamanho: ${htmlContent.length} caracteres).`);

        res.json({ html: htmlContent });

    } catch (error) {
        console.error('[Backend] Erro durante a clonagem via Puppeteer:', error);
        let errorMessage = 'Falha ao clonar a página.';
        if (error instanceof Error) {
           if (error.message.includes('timeout')) {
               errorMessage = 'Tempo limite excedido ao carregar a página. O site pode ser muito lento ou complexo.';
           } else {
               errorMessage = error.message;
           }
        }
        res.status(500).json({ error: errorMessage });

    } finally {
        // Garantir que o navegador Puppeteer seja fechado
        if (browser) {
            console.log('[Backend] Fechando Puppeteer...');
            await browser.close();
            console.log('[Backend] Puppeteer fechado.');
        }
    }
});

// Rota de health check (opcional)
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`[Backend] Servidor Express rodando na porta ${PORT}`);
    console.log(`[Backend] Aguardando requisições de ${FRONTEND_URL}`);
}); 