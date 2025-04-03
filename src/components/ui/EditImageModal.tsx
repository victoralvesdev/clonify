import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from './Dialog';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { UploadCloud, Link as LinkIcon, ImageIcon } from 'lucide-react';

interface EditImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSrc: string;
  currentAlt: string;
  onSave: (newSrc: string, newAlt: string) => void;
}

export const EditImageModal: React.FC<EditImageModalProps> = ({
  isOpen,
  onClose,
  currentSrc,
  currentAlt,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('url');
  const [newSrc, setNewSrc] = useState(currentSrc);
  const [newAlt, setNewAlt] = useState(currentAlt);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setNewSrc(currentSrc);
      setNewAlt(currentAlt);
      setFile(null);
      setActiveTab('url'); // Default to URL tab
    }
  }, [isOpen, currentSrc, currentAlt]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      // Convert file to data URL for immediate preview/save (simplification)
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewSrc(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      setIsDragging(true);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Verificar se é uma imagem
      if (!droppedFile.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      setFile(droppedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewSrc(reader.result as string);
      };
      reader.readAsDataURL(droppedFile);
    }
  }, []);

  const handleSave = () => {
    // Prioritize URL input if both are somehow filled
    const finalSrc = activeTab === 'url' || !file ? newSrc : newSrc; // newSrc is updated by file reader
    onSave(finalSrc, newAlt);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#151825] border-[#2D3748] text-white cursor-[url('/cursor.svg'),_auto] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#8A63F4]">Editar Imagem</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="url" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-[#1A1D2A] p-1 rounded-lg">
            <TabsTrigger value="url" className="data-[state=active]:bg-[#8A63F4] data-[state=active]:text-white rounded-md px-3 py-1.5 text-sm font-medium flex items-center justify-center gap-1">
              <LinkIcon size={16} /> URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-[#8A63F4] data-[state=active]:text-white rounded-md px-3 py-1.5 text-sm font-medium flex items-center justify-center gap-1">
              <UploadCloud size={16} /> Upload
            </TabsTrigger>
          </TabsList>

          {/* Aba URL */}
          <TabsContent value="url" className="mt-6 space-y-3">
            <p className="text-sm text-gray-400">Insira a URL da nova imagem.</p>
            <div>
              <Label htmlFor="img-url" className="text-sm font-medium text-gray-300">Nova URL da Imagem</Label>
              <textarea 
                id="img-url"
                placeholder="https://exemplo.com/imagem.jpg"
                value={newSrc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewSrc(e.target.value)}
                className="mt-1 bg-[#1e2235] border-[#3d435a] text-white w-full min-h-[80px] resize-y rounded p-2"
                spellCheck="false"
              />
            </div>
            <div className="text-xs text-gray-500">
              URL atual: 
              <div className="mt-1 max-h-[60px] overflow-y-auto">
                <code 
                  className="block whitespace-pre-wrap break-all font-mono bg-[#1e2235] p-2 rounded text-gray-400 text-xs"
                >
                  {currentSrc}
                </code>
              </div>
            </div>
          </TabsContent>

          {/* Aba Upload */}
          <TabsContent value="upload" className="mt-6 space-y-3">
             <p className="text-sm text-gray-400">Faça upload de uma nova imagem do seu computador.</p>
             
             <div className="mt-3">
               {/* Upload button */}
               <div className="flex items-center justify-center mb-3">
                 <label htmlFor="img-upload" className="cursor-pointer flex items-center justify-center bg-[#8A63F4] hover:bg-[#7B52E5] text-white py-2 px-4 rounded-md transition-colors duration-200 gap-2">
                   <UploadCloud size={18} />
                   <span>Escolher arquivo</span>
                   <Input 
                     id="img-upload"
                     type="file" 
                     accept="image/*" 
                     onChange={handleFileChange}
                     className="hidden"
                   />
                 </label>
               </div>
               
               {/* Drop Zone */}
               <div 
                 className={`border-2 border-dashed rounded-lg ${
                   isDragging ? 'border-[#8A63F4] bg-[#8A63F4]/10' : 'border-[#3d435a]'
                 } transition-colors duration-150 flex flex-col items-center justify-center h-40 p-4 relative`}
                 onDragEnter={handleDragEnter}
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={handleDrop}
               >
                 {newSrc.startsWith('data:image') && file ? (
                   <div className="flex flex-col items-center">
                     <div className="mt-2 border border-[#3d435a] rounded p-1 bg-[#1A1D2A]/50 shadow-sm">
                       <img 
                         src={newSrc} 
                         alt="Preview" 
                         className="max-h-28 max-w-full mx-auto object-contain" 
                       />
                     </div>
                     <p className="text-xs text-green-400 mt-2">
                       {file.name} ({Math.round(file.size / 1024)} KB)
                     </p>
                   </div>
                 ) : (
                   <>
                     <ImageIcon size={32} className="text-gray-500 mb-2" />
                     <p className="text-sm text-gray-400 text-center">
                       Arraste e solte uma imagem aqui
                     </p>
                     <p className="text-xs text-gray-500 mt-1 text-center">
                       ou use o botão acima para selecionar
                     </p>
                   </>
                 )}
               </div>
               
               <p className="text-xs text-gray-500 mt-2">Nota: O upload converte a imagem para Data URL.</p>
             </div>
          </TabsContent>
        </Tabs>

        {/* Campo Alt Text comum às duas abas */} 
        <div className="mt-4">
          <Label htmlFor="img-alt" className="text-sm font-medium text-gray-300">Texto Alternativo (Alt Text)</Label>
          <Input 
            id="img-alt"
            type="text" 
            placeholder="Descrição da imagem"
            value={newAlt}
            onChange={(e) => setNewAlt(e.target.value)}
            className="mt-1 bg-[#1e2235] border-[#3d435a] text-white"
          />
        </div>

        <DialogFooter className="mt-6 pt-4 border-t border-[#2D3748]">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-[#3d435a] text-white hover:bg-[#2d3348]"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#8A63F4] hover:bg-[#7B52E5] text-white"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 