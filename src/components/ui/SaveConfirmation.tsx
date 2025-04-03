import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface SaveConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToClonedPages?: () => void;
  title?: string;
}

export const SaveConfirmation: React.FC<SaveConfirmationProps> = ({
  isOpen,
  onClose,
  onGoToClonedPages,
  title = 'Página Sem Título'
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#151825] border border-[#2D3748] text-white cursor-[url('/cursor.svg'),_auto]">
        <DialogHeader>
          <DialogTitle className="text-[#8A63F4]">Página salva com sucesso!</DialogTitle>
          <DialogDescription className="text-gray-300">
            A página "{title}" foi salva em Páginas Clonadas.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-4">
          <div className="rounded-md bg-[#1A1D2A] p-4 border border-[#2D3748]">
            <svg className="h-10 w-10 text-[#8A63F4] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          {onGoToClonedPages && (
            <Button 
              variant="outline" 
              onClick={onGoToClonedPages}
              className="border-[#3d435a] text-white hover:bg-[#2d3348]"
            >
              Ir para páginas clonadas
            </Button>
          )}
          <Button 
            onClick={onClose}
            className="bg-[#8A63F4] hover:bg-[#7955E8] text-white"
          >
            Continuar Editando
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveConfirmation; 