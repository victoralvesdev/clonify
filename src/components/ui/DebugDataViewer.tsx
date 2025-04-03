import { useEffect, useState } from 'react';
import { FacebookAd } from '@/types/facebook';

interface DebugDataViewerProps {
  data: FacebookAd[] | any;
  title?: string;
}

export default function DebugDataViewer({ data, title = 'Dados de Debug' }: DebugDataViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Log dos dados para debug no console
    console.log('DebugDataViewer - dados recebidos:', data);
  }, [data]);

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md max-h-96 overflow-hidden flex flex-col bg-black bg-opacity-90 text-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-2 bg-gray-800 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="flex space-x-2">
          <button 
            className="px-2 py-1 text-xs bg-blue-600 rounded hover:bg-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Dados copiados:', data);
              navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                .then(() => alert('Dados copiados para a área de transferência!'))
                .catch(err => console.error('Falha ao copiar:', err));
            }}
          >
            Copiar
          </button>
          <button 
            className="px-2 py-1 text-xs bg-red-600 rounded hover:bg-red-700"
            onClick={(e) => {
              e.stopPropagation();
              const el = document.getElementById('debug-data-viewer');
              if (el) el.remove();
            }}
          >
            Fechar
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="overflow-auto p-3 text-xs" style={{ maxHeight: '350px' }}>
          {Array.isArray(data) ? (
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={index} className="border border-gray-700 rounded p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 bg-gray-800 p-1 rounded">
                      <span className="font-bold">ID:</span> 
                      <span className="font-mono text-green-400 ml-1">{item.id || 'N/A'}</span>
                    </div>
                    
                    {item.ad_archive_id && (
                      <div>
                        <span className="font-bold">Archive ID:</span> 
                        <span className="font-mono ml-1">{item.ad_archive_id}</span>
                      </div>
                    )}
                    
                    {item.page_name && (
                      <div>
                        <span className="font-bold">Página:</span> 
                        <span className="ml-1">{item.page_name}</span>
                      </div>
                    )}
                    
                    {item.ad_creative_link_titles?.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-bold">Título:</span> 
                        <span className="ml-1">{item.ad_creative_link_titles[0]}</span>
                      </div>
                    )}
                    
                    {item.ad_creative_bodies?.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-bold">Texto:</span> 
                        <p className="mt-1 line-clamp-2 text-gray-300">
                          {item.ad_creative_bodies[0]}
                        </p>
                      </div>
                    )}
                    
                    {item.media_urls?.image && (
                      <div className="col-span-2">
                        <span className="font-bold">Imagem:</span> 
                        <a 
                          href={item.media_urls.image} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-400 hover:underline"
                        >
                          Ver imagem
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
} 