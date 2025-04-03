'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FrameProps {
  html: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  scale?: number;
  onLoad?: () => void;
  onElementSelect?: (element: HTMLElement) => void;
  onError?: (message: string) => void;
}

export function Frame({ 
  html, 
  className, 
  width = '100%', 
  height = '600px', 
  scale = 1, 
  onLoad,
  onElementSelect,
  onError
}: FrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFrameInitialized, setIsFrameInitialized] = useState(false);
  
  // Função auxiliar para extrair conteúdo do <head>
  const extractHeadContent = (rawHtml: string): string => {
    const headMatch = rawHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    return headMatch ? headMatch[1] : '';
  };
  
  // Função auxiliar para extrair conteúdo do <body>
  const extractBodyContent = (rawHtml: string): string => {
    const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : rawHtml; // Fallback para o HTML inteiro se não achar body
  };
  
  // Inicializar o iframe apenas uma vez com o HTML
  useEffect(() => {
    if (!iframeRef.current) return;
    if (!html) {
      console.warn('Frame: HTML vazio ou indefinido');
      setIsLoading(false);
          return;
        }
        
    const iframe = iframeRef.current;
    let isMounted = true; // Flag para verificar se o componente ainda está montado

    const handleLoad = () => {
      if (!isMounted) return;
      setIsLoading(false);
      if (onLoad) onLoad();
      setIsFrameInitialized(true);
      
      // Adicionar script de comunicação/edição APÓS o load
      if (iframe.contentDocument && iframe.contentWindow) {
        // Verifica se a função updateElement já existe para evitar redeclaração
        if (!(iframe.contentWindow as any).updateElement) {
            const script = iframe.contentDocument.createElement('script');
            script.textContent = `
              // Script para comunicação e edição (sem lazyloadRunObserver)
              window.lastClickedElementId = null;
              function assignTemporaryIds() {
                const allElements = document.querySelectorAll('*:not([id])');
                let tempIdCounter = 0;
                allElements.forEach(el => { el.id = 'temp-id-' + tempIdCounter++; });
              }
              assignTemporaryIds();
              document.body.addEventListener('click', function(e) {
                e.preventDefault();
                const element = e.target;
                if (element) {
                  window.lastClickedElementId = element.id;
                  const styles = window.getComputedStyle(element);
                  const elementData = {
                    id: element.id,
                    tagName: element.tagName,
                    className: element.className,
                    textContent: element.textContent,
                    innerHTML: element.innerHTML,
                    outerHTML: element.outerHTML,
                    styles: {
                      backgroundColor: styles.backgroundColor,
                      color: styles.color,
                      fontSize: styles.fontSize,
                      padding: styles.padding,
                      margin: styles.margin,
                      borderRadius: styles.borderRadius
                    }
                  };
                  window.parent.postMessage({ type: 'ELEMENT_CLICKED', data: elementData, elementId: element.id }, '*');
                  console.log('Elemento selecionado:', element.tagName, element.id);
                }
              });
              window.updateElement = function(id, props) {
                const element = document.getElementById(id);
                if (!element) return false;
                try {
                  if (props.textContent !== undefined) element.textContent = props.textContent;
                  if (props.style) { Object.keys(props.style).forEach(key => { element.style[key] = props.style[key]; }); }
                  return true;
                } catch (err) { console.error('Erro ao atualizar elemento:', err); return false; }
              };
              console.log('Script de comunicação do Frame injetado.');
            `;
            iframe.contentDocument.head.appendChild(script);
        } else {
           console.log('Script de comunicação do Frame já existe, não reinjetando.');
        }
      }
    };

    // Resetar estado de inicialização para forçar recarga se o HTML mudar
    setIsFrameInitialized(false);
    setIsLoading(true);
    
    // Limpar listeners antigos se existirem
    iframe.onload = null;
    iframe.onerror = null;

    iframe.onload = handleLoad;
    iframe.onerror = () => {
      if (!isMounted) return;
      console.error('Frame: Erro ao carregar o conteúdo do iframe.');
      setIsLoading(false);
      if (onError) {
        onError('Erro interno ao renderizar o preview.');
      }
    };
    
    // Escrever HTML no iframe com injeção de script para comunicação
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        
    if (iframeDoc) {
        iframeDoc.open();
      
      const bodyContent = extractBodyContent(html);
      const headContent = extractHeadContent(html);

      // Adicionar script para comunicação com a página principal
      const htmlWithComms = `
        <!DOCTYPE html>
        <html style="height: 100%; width: 100%;">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${headContent}
          <style>
            /* Estilos adicionais para melhorar a visualização */
            body { margin: 0; padding: 0; height: 100%; width: 100%; }
            /* Destacar elementos ao passar o mouse (opcional) */
            *:hover { outline: 1px dashed rgba(0, 123, 255, 0.2); }
            /* Garantir que imagens lazy sejam visíveis se a classe for adicionada */
            img[data-src] {
              opacity: 1 !important;
              visibility: visible !important;
            }
          </style>
        </head>
        <body style="height: 100%; width: 100%;">
          ${bodyContent}
        </body>
        </html>
      `;
      
      iframeDoc.write(htmlWithComms);
      iframeDoc.close();
    } else {
        console.error("Frame: Não foi possível obter o documento do iframe.");
        setIsLoading(false);
    }
    
    // Cleanup function
    return () => {
        isMounted = false;
        // Limpar listeners ao desmontar ou antes de re-renderizar
        if (iframeRef.current) {
            iframeRef.current.onload = null;
            iframeRef.current.onerror = null;
        }
    };

  }, [html, onError]); // Dependência principal é o HTML
  
  // Configurar listener de mensagens separadamente (não recria quando props mudam)
  useEffect(() => {
    // Adicionar listener para mensagens do iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_CLICKED' && onElementSelect) {
        console.log('Elemento clicado no iframe:', event.data);
        
        try {
          // Criar um elemento temporário para obter acesso a propriedades do DOM
          const tempElement = document.createElement('div');
          tempElement.innerHTML = event.data.data?.outerHTML || '';
          const clickedElement = tempElement.firstChild as HTMLElement || tempElement;
          
          if (clickedElement) {
            // Adicionar metadados especiais que identificam este elemento como vindo do iframe
            clickedElement.dataset.fromIframe = 'true';
            clickedElement.dataset.iframeElementId = event.data.elementId;
            
            // Copiar propriedades do elemento original
            const elementData = event.data.data;
            if (elementData) {
              clickedElement.dataset.id = elementData.id;
              clickedElement.dataset.tagName = elementData.tagName;
              clickedElement.dataset.className = elementData.className;
              
              // Garantir que o conteúdo textual é preservado
              if (!clickedElement.textContent && elementData.textContent) {
                clickedElement.textContent = elementData.textContent;
              }
              
              // Aplicar estilos
              const styles = elementData.styles;
              if (styles) {
                Object.entries(styles).forEach(([key, value]) => {
                  if (value && typeof value === 'string') {
                    try {
                      clickedElement.style[key as any] = value;
                    } catch (err) {
                      console.warn(`Frame: Não foi possível definir estilo ${key}:`, err);
                    }
                  }
                });
              }
            }
            
            console.log('Frame: Elemento reconstruído para edição:', {
              id: clickedElement.dataset.iframeElementId,
              tagName: clickedElement.tagName,
              className: clickedElement.className,
              textContent: clickedElement.textContent?.substring(0, 30)
            });
            
            // Adicionar método auxiliar para facilitar a atualização no iframe
            (clickedElement as any).updateInIframe = function(props: any) {
              const iframe = iframeRef.current;
              if (!iframe || !iframe.contentWindow) return false;
              
              const elementId = this.dataset.iframeElementId;
              if (!elementId) return false;
              
              // Usar any para ignorar o erro de tipo
              const contentWindow = iframe.contentWindow as any;
              return contentWindow.updateElement(elementId, props);
            };
            
            // Passar o elemento para o callback
            onElementSelect(clickedElement);
            } else {
            console.error('Frame: Elemento clicado não pôde ser reconstruído');
          }
        } catch (error) {
          console.error('Frame: Erro ao processar elemento clicado:', error);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onElementSelect]);

  return (
    <div className={cn("iframe-container relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="loading-spinner w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Preview"
        style={{ 
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
          border: 'none',
        }}
        sandbox="allow-same-origin allow-scripts"
        className="bg-white"
      />
    </div>
  );
} 