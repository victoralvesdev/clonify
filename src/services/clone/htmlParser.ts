export async function parseHTML(url: string): Promise<string> {
  try {
    const response = await fetch('/api/clone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('Falha ao clonar a página');
    }

    const data = await response.json();
    return data.html;
  } catch (error) {
    console.error('Erro ao fazer parse do HTML:', error);
    throw new Error('Não foi possível clonar a página. Verifique a URL e tente novamente.');
  }
}

export function processStyles(html: string, baseUrl: string): string {
  // TODO: Processar estilos inline e externos
  return html;
}

export function processAssets(html: string, baseUrl: string): string {
  // TODO: Processar imagens e outros assets
  return html;
}

export function sanitizeHTML(html: string): string {
  // TODO: Remover scripts e conteúdo potencialmente perigoso
  return html;
} 