import React, { useRef, useEffect } from 'react';

interface FrameProps {
  content: string;
}

export function Frame({ content }: FrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        // Limpar scripts do LiteSpeed antes de inserir o conteúdo
        const cleanedContent = content.replace(
          /<script[\s\S]*?<\/script>/gi,
          ''
        );

        // Limpa o documento
        iframeDocument.open();
        
        // Adiciona o conteúdo HTML limpo
        iframeDocument.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                /* Reset básico para garantir visibilidade */
                [data-editable] {
                  visibility: visible !important;
                  opacity: 1 !important;
                }

                /* Garantir que imagens sejam responsivas */
                img {
                  max-width: 100%;
                  height: auto;
                }
              </style>
            </head>
            <body>
              ${cleanedContent}
            </body>
          </html>
        `);
        
        iframeDocument.close();
      }
    }
  }, [content]);

  return (
    <div className="w-full h-[600px] border border-border rounded-lg overflow-hidden">
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        title="Preview"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
} 