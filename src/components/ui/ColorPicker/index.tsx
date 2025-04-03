import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(color);
  
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };
  
  return (
    <div className={cn("color-picker", className)}>
      <div className="mb-2">
        <div className="flex items-center mb-2">
          <Palette className="h-4 w-4 mr-2" />
          <span>Selecione uma cor</span>
        </div>
        <div className="color-grid grid grid-cols-10 gap-1">
          {DEFAULT_COLORS.map((colorHex) => (
            <button
              key={colorHex}
              type="button"
              className={cn(
                "w-6 h-6 rounded-sm border border-gray-300 transition-all hover:scale-110",
                color === colorHex && "ring-2 ring-blue-500"
              )}
              style={{ backgroundColor: colorHex }}
              onClick={() => onChange(colorHex)}
              title={colorHex}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-3">
        <label className="block text-sm font-medium mb-1">Cor personalizada</label>
        <div className="flex items-center">
          <input
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="w-8 h-8 mr-2 cursor-pointer"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              // Apenas atualize a cor principal se for um valor hexadecimal válido
              if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
                onChange(e.target.value);
              }
            }}
            className="w-24 px-2 py-1 text-sm border rounded"
          />
        </div>
      </div>
    </div>
  );
} 