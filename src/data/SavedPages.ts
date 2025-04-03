export interface SavedPage {
  id: string;
  title: string;
  originalUrl: string;
  html: string;
  css: string;
  thumbnail: string; // URL da imagem de visualização
  createdAt: string; // ISO string da data
  updatedAt: string; // ISO string da data
}

// Função para recuperar as páginas salvas do localStorage
export const getSavedPages = (): SavedPage[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedPages = localStorage.getItem('savedPages');
    if (!savedPages) return [];
    
    // Parsing de JSON já retorna as datas como strings
    const pages = JSON.parse(savedPages);
    console.log('Páginas recuperadas:', pages);
    return pages;
  } catch (error) {
    console.error('Erro ao recuperar páginas salvas:', error);
    return [];
  }
};

// Função para salvar uma página
export const savePage = (newPage: Omit<SavedPage, 'id' | 'createdAt' | 'updatedAt'>): SavedPage => {
  const savedPages = getSavedPages();
  const pageId = `page_${new Date().getTime()}`;
  const now = new Date().toISOString();
  
  const pageToSave: SavedPage = {
    ...newPage,
    id: pageId,
    createdAt: now,
    updatedAt: now,
    thumbnail: '', // Definir como string vazia ou outro valor placeholder
  };
  
  const updatedPages = [...savedPages, pageToSave];
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('savedPages', JSON.stringify(updatedPages));
      console.log('Página salva:', pageToSave);
      console.log('Todas as páginas após salvar:', updatedPages);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }
  
  return pageToSave;
};

// Função para atualizar uma página existente
export const updatePage = (updatedPageData: Pick<SavedPage, 'id' | 'title' | 'html' | 'css' | 'originalUrl'>): SavedPage | null => {
  const savedPages = getSavedPages();
  const pageIndex = savedPages.findIndex(page => page.id === updatedPageData.id);

  if (pageIndex === -1) {
    console.error('Página não encontrada para atualização:', updatedPageData.id);
    return null;
  }

  // Manter a data de criação original, atualizar a data de modificação
  const pageToUpdate: SavedPage = {
    ...savedPages[pageIndex], // Preserva createdAt
    title: updatedPageData.title,
    html: updatedPageData.html,
    css: updatedPageData.css,
    originalUrl: updatedPageData.originalUrl,
    updatedAt: new Date().toISOString(), // Atualiza data de modificação
    // Gerar novo thumbnail com o título atualizado (ou manter o placeholder)
    thumbnail: '' // Definir como string vazia ou outro valor placeholder
  };

  const updatedPages = [...savedPages];
  updatedPages[pageIndex] = pageToUpdate;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('savedPages', JSON.stringify(updatedPages));
      console.log('Página atualizada:', pageToUpdate);
      return pageToUpdate;
    } catch (error) {
      console.error('Erro ao atualizar página no localStorage:', error);
      return null;
    }
  }
  return null;
};

// Função para excluir uma página
export const deletePage = (id: string): boolean => {
  const savedPages = getSavedPages();
  const filteredPages = savedPages.filter(page => page.id !== id);
  
  if (filteredPages.length === savedPages.length) {
    console.log('Nenhuma página encontrada com o ID:', id);
    return false;
  }
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('savedPages', JSON.stringify(filteredPages));
      console.log('Página excluída com ID:', id);
      console.log('Páginas restantes:', filteredPages);
    } catch (error) {
      console.error('Erro ao excluir página do localStorage:', error);
      return false;
    }
  }
  
  return true;
};

// Função para gerar uma miniatura da página
export const generateThumbnail = (html: string, css: string, pageTitle: string = 'Página Clonada'): string => {
  try {
    // Criar um SVG que inclui o título da página
    const titleToDisplay = pageTitle.length > 30 ? pageTitle.substring(0, 27) + '...' : pageTitle;
    
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#151825" />
            <stop offset="100%" stop-color="#1A1D2A" />
          </linearGradient>
        </defs>
        <rect width="800" height="450" fill="url(#grad)" />
        <text x="400" y="225" font-family="Arial, Helvetica, sans-serif" font-size="24" 
              fill="#8A63F4" text-anchor="middle" alignment-baseline="middle">
          ${titleToDisplay}
        </text>
        <text x="400" y="265" font-family="Arial, Helvetica, sans-serif" font-size="16" 
              fill="#ffffff80" text-anchor="middle" alignment-baseline="middle">
          (Preview)
        </text>
      </svg>
    `;
    
    // Remover espaços em branco extras e quebras de linha para economia de espaço
    const cleanedSvg = svgContent.replace(/\s+/g, ' ').trim();
    
    // Converter para base64
    return `data:image/svg+xml;base64,${btoa(cleanedSvg)}`;
  } catch (error) {
    console.error('Erro ao gerar thumbnail com título:', error);
    // Backup fallback em caso de erro
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iIzE1MTgyNSIgLz48dGV4dCB4PSI0MDAiIHk9IjIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSIjOEE2M0Y0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+UHJldmlldyBuYW8gZGlzcG9uaXZlbDwvdGV4dD48L3N2Zz4=';
  }
}; 