import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface NameInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pageName: string) => void;
  defaultName?: string;
}

export const NameInputDialog: React.FC<NameInputDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultName = ''
}) => {
  const [pageName, setPageName] = useState(defaultName);

  const handleConfirm = () => {
    if (pageName.trim()) {
      onConfirm(pageName.trim());
      setPageName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#151825] border border-[#2D3748] text-white cursor-[url('/cursor.svg'),_auto]">
        <DialogHeader>
          <DialogTitle className="text-[#8A63F4]">Nome da página</DialogTitle>
          <DialogDescription className="text-gray-300">
            Digite um nome para sua página salva.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            autoFocus
            className="bg-[#1A1D2A] text-white border-[#2D3748] focus:border-[#8A63F4] focus:ring-[#8A63F4]/20"
            placeholder="Minha página"
            value={pageName}
            onChange={(e) => setPageName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-[#8A63F4] hover:bg-[#7955E8] text-white flex-1"
            disabled={!pageName.trim()}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NameInputDialog; 