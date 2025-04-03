import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Popover({
  trigger,
  content,
  isOpen,
  onOpenChange,
  placement = 'bottom',
  className
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        contentRef.current && 
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onOpenChange]);
  
  const getPlacementStyles = () => {
    switch (placement) {
      case 'top':
        return 'bottom-full mb-2';
      case 'bottom':
        return 'top-full mt-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default:
        return 'top-full mt-2';
    }
  };
  
  return (
    <div className="relative inline-block">
      <div 
        ref={triggerRef}
        onClick={() => onOpenChange(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div
          ref={contentRef}
          className={cn(
            "absolute z-50 min-w-[8rem] rounded-md border border-gray-200 bg-white p-2 shadow-md animate-in fade-in-80",
            getPlacementStyles(),
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
} 