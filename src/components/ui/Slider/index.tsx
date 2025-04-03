import React, { useState, useRef, useEffect } from 'react';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number[];
  onValueChange: (value: number[]) => void;
  id?: string;
  className?: string;
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  id,
  className = '',
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  
  const currentValue = value[0];
  const percentage = ((currentValue - min) / (max - min)) * 100;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.current || !trackRef.current) return;
      
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
      const newPercentage = (x / rect.width) * 100;
      const newValue = min + (newPercentage / 100) * (max - min);
      const steppedValue = Math.round(newValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));
      
      onValueChange([clampedValue]);
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    if (isDragging.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging.current, min, max, step, onValueChange]);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!trackRef.current) return;
    
    isDragging.current = true;
    
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const newPercentage = (x / rect.width) * 100;
    const newValue = min + (newPercentage / 100) * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    
    onValueChange([clampedValue]);
  };

  return (
    <div className={`relative py-4 ${className}`}>
      <div
        ref={trackRef}
        className="h-2 bg-gray-700 rounded-full cursor-pointer"
        onMouseDown={handleMouseDown}
        id={id}
      >
        <div
          className="absolute h-2 bg-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <div
          ref={thumbRef}
          className="absolute w-4 h-4 bg-white rounded-full shadow-lg -mt-1 transform -translate-x-1/2 hover:scale-110 transition-transform cursor-grab active:cursor-grabbing"
          style={{ left: `${percentage}%` }}
          onMouseDown={() => {
            isDragging.current = true;
          }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
} 