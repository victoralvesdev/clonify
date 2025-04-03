import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Zap, Download, Copy, Upload, Pencil, Monitor, Smartphone } from 'lucide-react';
import { Button } from '../Button';
import { Frame } from '../Preview/Frame';

interface CloneViewerProps {
  html: string;
  initialCss: string;
  technologies: string[];
  incompatibleTechnologies: string[];
  onBack: () => void;
  onEdit: () => void;
  onLightningEdit?: () => void;
  onDownload?: () => void;
  onError?: (message: string) => void;
}

export function CloneViewer({ 
  html, 
  initialCss,
  technologies, 
  incompatibleTechnologies, 
  onBack, 
  onEdit,
  onLightningEdit,
  onDownload,
  onError
}: CloneViewerProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  console.log("CloneViewer recebeu HTML:", { 
    htmlExists: !!html,
    htmlLength: html?.length || 0,
    technologiesCount: technologies?.length || 0,
    incompatibleCount: incompatibleTechnologies?.length || 0
  });

  const [iframeBaseUrl, setIframeBaseUrl] = useState<string | null>(null);
  useEffect(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const baseTag = doc.querySelector('base');
      if (baseTag && baseTag.href) {
        setIframeBaseUrl(baseTag.href);
      } else {
        const firstLink = doc.querySelector('a[href^="http"]');
        if (firstLink && (firstLink as HTMLAnchorElement).href) {
          const url = new URL((firstLink as HTMLAnchorElement).href);
          setIframeBaseUrl(url.origin);
        }
      }
    } catch (e) {
      console.error("Erro ao extrair URL base do HTML para preview:", e);
    }
  }, [html]);

  const handleIframeLoad = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        const style = doc.createElement('style');
        style.textContent = `
          /* Estilos básicos para reset e cursor */
          body, html { margin: 0; padding: 0; height: 100%; overflow: auto; cursor: url('/cursor.svg'), auto !important; }
          /* Remover outlines/borders/shadows genéricos no hover */
          *:hover {
            outline: none !important; 
            border: 0 !important; /* Forçar borda 0 */
            box-shadow: none !important; 
          }
          /* Garantir que links não tenham sublinhado estranho no hover */
          a:hover {
            text-decoration: none !important;
          }
        `;
        doc.head.appendChild(style);
      }
    }
  };

  return (
    <div className="bg-[#030617] text-white transition-all duration-300 ease-in-out full-height-container">
      {/* Header */}
      <header className="border-b border-gray-800 p-3 sticky top-0 z-20 bg-[#030617]">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Replicação
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full py-4 px-2 transition-all duration-300 ease-in-out flex flex-col">
        {/* Title and Progress */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Personalizar Site</h1>
        </div>

        {/* Technology Detection */}
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">Verificação de Tecnologias</span>
                <span className="bg-blue-500 text-xs px-2 py-1 rounded-full">
                  {technologies.length + incompatibleTechnologies.length} detectadas
                </span>
              </h3>
              
              <div className="space-y-4">
                {incompatibleTechnologies.length > 0 && (
                  <div>
                    <p className="text-yellow-500 mb-2">Atenção - Potenciais incompatibilidades:</p>
                    <div className="flex flex-wrap gap-2">
                      {incompatibleTechnologies.map((tech) => (
                        <span
                          key={tech}
                          className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-green-500 mb-2">Tecnologias compatíveis ({technologies.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {technologies.map((tech) => (
                      <span
                        key={tech}
                        className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Controls and Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex gap-2 bg-gray-900 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Desktop
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {onLightningEdit && (
              <Button 
                variant="outline" 
                className="gap-2 text-white border-gray-700 hover:bg-gray-700 hover:text-white"
                onClick={onLightningEdit}
              >
                <Zap className="w-4 h-4" />
                Edição Relâmpago
              </Button>
            )}
            <Button 
              variant="outline" 
              className="gap-2 text-white border-gray-700 hover:bg-gray-700 hover:text-white"
              onClick={onDownload}
            >
              <Download className="w-4 h-4" />
              Download HTML
            </Button>
            <Button variant="outline" className="gap-2 text-white border-gray-700 hover:bg-gray-700 hover:text-white" disabled>
              <Upload className="w-4 h-4" />
              Publicar site
            </Button>
            <Button onClick={onEdit} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Pencil className="w-4 h-4" />
              Personalizar no Editor
            </Button>
          </div>
        </div>

        {/* Preview Frame */}
        <div className={`bg-white rounded-lg overflow-visible transition-all w-full ${
          viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
        }`}>
          {html ? (
            <iframe
              ref={iframeRef}
              srcDoc={`
                <html>
                  <head>
                    <base href="${iframeBaseUrl || '/'}"> 
                    <style>${initialCss}</style>
                    <style>
                      /* Estilos básicos para reset e cursor */
                      body, html { margin: 0; padding: 0; height: 100%; overflow: auto; cursor: url('/cursor.svg'), auto !important; }
                      /* Remover outlines/borders/shadows genéricos no hover */
                      *:hover {
                        outline: none !important; 
                        border: 0 !important; /* Forçar borda 0 */
                        box-shadow: none !important; 
                      }
                      /* Garantir que links não tenham sublinhado estranho no hover */
                      a:hover {
                        text-decoration: none !important;
                      }
                    </style>
                  </head>
                  <body>${html}</body>
                </html>
              `}
              className={`w-full min-h-[80vh] border-2 border-gray-800 rounded-lg transition-all duration-300 ${
                viewMode === 'mobile' ? 'max-w-[375px] mx-auto' : ''
              }`}
              title="Preview"
              sandbox="allow-scripts allow-same-origin" // Manter sandbox para segurança
              onLoad={handleIframeLoad}
            />
          ) : (
            <div className="p-8 text-center text-black">
              <p className="text-red-500 font-bold mb-2">Erro ao carregar o conteúdo</p>
              <p className="text-gray-700">O HTML da página não foi recebido corretamente.</p>
              <button 
                onClick={onBack} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 