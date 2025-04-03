'use client';

import React from 'react';
import { SavedPage } from '@/data/SavedPages';
import { Button } from '@/components/ui/Button';
import { ExternalLink, Eye, Pencil, Trash2, Clock, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavedPageListItemProps {
  page: SavedPage;
  onView: (page: SavedPage) => void;
  onEdit: (page: SavedPage) => void;
  onDelete: (page: SavedPage) => void;
}

export const SavedPageListItem: React.FC<SavedPageListItemProps> = ({
  page,
  onView,
  onEdit,
  onDelete,
}) => {
  // Formatar a data de criação
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  // Limitar a URL para exibição
  const formatUrl = (url: string | undefined): string => {
    if (!url) return 'N/A';
    try {
      const parsedUrl = new URL(url);
      // Remover 'www.' se existir e limitar o comprimento
      let displayUrl = parsedUrl.hostname.replace(/^www\./, '');
      if (parsedUrl.pathname !== '/') {
        displayUrl += parsedUrl.pathname;
      }
      // Limitar o comprimento total
      const maxLength = 40;
      return displayUrl.length > maxLength ? displayUrl.substring(0, maxLength - 3) + '...' : displayUrl;
    } catch {
      // Se a URL for inválida, apenas retornar o início dela
      const maxLength = 40;
      return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-[#151825] border border-[#2D3748] rounded-lg mb-3 transition-all duration-200 hover:border-[#8A63F4]/50">
      {/* Ícone e informações da página (Esquerda) */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <FileIcon className="h-5 w-5 text-[#8A63F4]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-sm truncate" title={page.title}>
            {page.title || 'Página Sem Título'}
          </h3>
          <p className="text-gray-400 text-xs flex items-center">
            Criado em {formatDate(page.createdAt)}
          </p>
        </div>
      </div>

      {/* URL da página original (Centro) */}
      {page.originalUrl ? (
        <div className="hidden md:flex flex-1 justify-center">
          <a
            href={page.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-[#8A63F4] flex items-center gap-1 truncate max-w-[200px]"
            title={page.originalUrl}
          >
            {formatUrl(page.originalUrl)}
            <ExternalLink size={10} className="flex-shrink-0"/>
          </a>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 justify-center">
          <span className="text-xs text-gray-500 italic">URL não disponível</span>
        </div>
      )}

      {/* Botões de ação (Direita) */}
      <div className="flex items-center gap-1.5">
        {/* Botão de visualizar */}
        <Button
          variant="outline"
          size="sm"
          className="text-white border-[#3d435a] hover:bg-[#2d3348] h-7 px-2 rounded"
          onClick={() => onView(page)}
          title="Visualizar"
        >
          <Eye size={14} className="mr-1" />
          <span className="hidden sm:inline text-xs">Visualizar</span>
        </Button>
        
        {/* Botão de editar */}
        <Button
          variant="outline"
          size="sm"
          className="text-white border-[#3d435a] hover:bg-[#2d3348] h-7 px-2 rounded"
          onClick={() => onEdit(page)}
          title="Editar"
        >
          <Pencil size={14} className="mr-1" />
          <span className="hidden sm:inline text-xs">Editar</span>
        </Button>
        
        {/* Menu de mais opções (3 pontos verticais) - opcional para ações adicionais */}
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-400 hover:bg-red-900/20 p-1.5 h-auto"
          onClick={() => onDelete(page)}
          title="Excluir Página"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
};

export default SavedPageListItem; 