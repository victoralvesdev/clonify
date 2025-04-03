'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Loader2 } from 'lucide-react';

interface URLInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

export function URLInput({ onSubmit, isLoading = false }: URLInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      console.log('URLInput - Enviando URL:', trimmedUrl);
      onSubmit(trimmedUrl);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('URLInput - Valor atual:', e.target.value);
    setUrl(e.target.value);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="rounded-lg border bg-card text-card-foreground p-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Cole a URL do site que deseja clonar</h2>
          <p className="text-sm text-muted-foreground">
            Insira a URL completa do site que você deseja clonar. O site será clonado e você poderá personalizá-lo.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="url"
            placeholder="https://exemplo.com"
            value={url}
            onChange={handleChange}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={isLoading || !url.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clonando...
              </>
            ) : (
              'Clonar Página'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
} 