import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CircuitEffect } from './CircuitEffect';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noCircuit?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, onClick, noCircuit = false }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      const { width, height } = cardRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-white/[0.03] backdrop-blur-[8px]",
        "border border-white/[0.05]",
        "shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]",
        "transition-all duration-300",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.08] before:to-transparent before:rounded-xl",
        "hover:bg-white/[0.06] hover:border-white/[0.08]",
        "hover:shadow-[0_8px_32px_0_rgba(138,99,244,0.1)]",
        onClick && "cursor-pointer",
        "group",
        className
      )}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Efeito de brilho que segue o mouse - Temporariamente desabilitado para teste */}
      {/* <div
        className="absolute pointer-events-none inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, 
            rgba(64, 153, 255, 0.08), 
            transparent 70%
          )`
        }}
      /> */}

      {/* Efeito de Circuito com Spotlight */}
      {isHovered && dimensions.width > 0 && !noCircuit && (
        <div 
          className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            mask: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, white, transparent 70%)`,
            WebkitMask: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, white, transparent 70%)`
          }}
        >
          <CircuitEffect 
            mouseX={mousePosition.x} 
            mouseY={mousePosition.y}
            containerWidth={dimensions.width}
            containerHeight={dimensions.height}
          />
        </div>
      )}

      {/* Conteúdo do card */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
}; 