import React from 'react';
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard } from "@/components/ui/GlassCard";

// Props que este componente poderia receber no futuro (ex: dados dos anúncios, funções de filtro)
interface EspioneTabProps {
  // Adicione props conforme necessário, ex:
  // searchResults: any[];
  // isLoading: boolean;
  // handleSearch: () => void;
}

export const EspioneTab: React.FC<EspioneTabProps> = ({ /* Adicione props aqui */ }) => {
  return (
    <div className="space-y-8">
      {/* Título e Descrição */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Espione Anuncios</h1>
        <p className="text-gray-400">
          Encontre e analise anúncios de alta conversão para inspirar suas campanhas.
        </p>
      </div>

      {/* Container de filtros */}
      <div className="bg-transparent border border-[#2D3748] rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Local */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Local</label>
            <Select>
              <SelectTrigger className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12">
                <SelectValue placeholder="Selecione o Local" />
              </SelectTrigger>
              <SelectContent className="bg-[#151825] border-[#2D3748] text-white">
                <SelectItem value="br">Brasil</SelectItem>
                <SelectItem value="us">Estados Unidos</SelectItem>
                <SelectItem value="pt">Portugal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plataforma */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Plataforma</label>
            <Select>
              <SelectTrigger className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12">
                <SelectValue placeholder="Selecione a Plataforma" />
              </SelectTrigger>
              <SelectContent className="bg-[#151825] border-[#2D3748] text-white">
                <SelectItem value="fb">Facebook</SelectItem>
                <SelectItem value="ig">Instagram</SelectItem>
                <SelectItem value="tk">TikTok</SelectItem>
                <SelectItem value="gg">Google Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Mídia */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Tipo de Mídia</label>
            <Select>
              <SelectTrigger className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12">
                <SelectValue placeholder="Selecione o Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-[#151825] border-[#2D3748] text-white">
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="carousel">Carrossel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Objetivo */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Objetivo</label>
            <Select>
              <SelectTrigger className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12">
                <SelectValue placeholder="Selecione o Objetivo" />
              </SelectTrigger>
              <SelectContent className="bg-[#151825] border-[#2D3748] text-white">
                <SelectItem value="conversion">Conversão</SelectItem>
                <SelectItem value="traffic">Tráfego</SelectItem>
                <SelectItem value="engagement">Engajamento</SelectItem>
                <SelectItem value="lead">Lead Generation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data de Início */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Data de Início</label>
            <div className="relative">
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                defaultValue="01/01/2024"
                className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12 pl-10 pr-4 focus:outline-none focus:border-[#8A63F4]"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8A63F4]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
          </div>

          {/* Data de Término */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Data de Término</label>
            <div className="relative">
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                defaultValue="30/04/2025"
                className="w-full bg-transparent border border-[#2D3748] rounded-lg text-white h-12 pl-10 pr-4 focus:outline-none focus:border-[#8A63F4]"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8A63F4]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
          </div>

          {/* Botão de Busca */}
          <div className="flex items-end col-span-1 md:col-span-2 lg:col-span-1">
            <button className="w-full bg-[#8A63F4] hover:bg-[#7955E8] text-white h-12 rounded-lg font-medium transition-colors">
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Resultados da Pesquisa - Com efeito GlassCard */}
      <GlassCard className="p-6" noCircuit>
        <div className="flex justify-between items-center pb-6">
          <h3 className="text-xl font-bold text-white">Resultados da Pesquisa</h3>
          <span className="text-gray-400 text-sm">0 Anúncios encontrados</span>
        </div>

        {/* Estado vazio */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-[#151825]/80 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#8A63F4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h4 className="text-lg font-medium text-white mb-2">Nenhum anúncio encontrado</h4>
          <p className="text-gray-400 max-w-md">
            Use os filtros acima para encontrar anúncios relevantes ou tente uma pesquisa com critérios diferentes.
          </p>
        </div>
        {/* Aqui seria o local para mapear e exibir os resultados da busca */}
        {/* Exemplo:
        {isLoading ? (
          <p>Carregando...</p>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          // Estado vazio já tratado acima
        )}
        */}
      </GlassCard>
    </div>
  );
};

export default EspioneTab; // Adicionando export default para React.lazy 