import React, { useEffect, useRef, useMemo } from 'react';

interface CircuitEffectProps {
  mouseX: number;
  mouseY: number;
  containerWidth: number;
  containerHeight: number;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'horizontal' | 'vertical' | 'diagonal';
  opacity: number;
}

export const CircuitEffect: React.FC<CircuitEffectProps> = ({ mouseX, mouseY, containerWidth, containerHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Criar linhas do circuito uma única vez usando useMemo
  const lines = useMemo(() => {
    const gridSize = 30;
    const generatedLines: Line[] = [];

    for (let y = 0; y < containerHeight; y += gridSize) {
      for (let x = 0; x < containerWidth; x += gridSize) {
        // Linhas horizontais
        if (Math.random() > 0.4) {
          generatedLines.push({
            x1: x,
            y1: y,
            x2: x + gridSize,
            y2: y,
            type: 'horizontal',
            opacity: 0.1 + Math.random() * 0.2
          });
        }

        // Linhas verticais
        if (Math.random() > 0.4) {
          generatedLines.push({
            x1: x,
            y1: y,
            x2: x,
            y2: y + gridSize,
            type: 'vertical',
            opacity: 0.1 + Math.random() * 0.2
          });
        }

        // Linhas diagonais (25% de chance)
        if (Math.random() > 0.75) {
          const isDiagonalRight = Math.random() > 0.5;
          generatedLines.push({
            x1: x,
            y1: y,
            x2: x + gridSize,
            y2: isDiagonalRight ? y + gridSize : y - gridSize,
            type: 'diagonal',
            opacity: 0.1 + Math.random() * 0.2
          });
        }
      }
    }

    return generatedLines;
  }, [containerWidth, containerHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    const draw = () => {
      ctx.clearRect(0, 0, containerWidth, containerHeight);

      // Desenhar todas as linhas primeiro com opacidade base
      lines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.strokeStyle = `rgba(64, 153, 255, ${line.opacity * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Adicionar nós nas interseções
        if (line.type !== 'diagonal') {
          const size = 2;
          ctx.fillStyle = `rgba(64, 153, 255, ${line.opacity * 0.75})`;
          ctx.fillRect(line.x1 - size/2, line.y1 - size/2, size, size);
          ctx.fillRect(line.x2 - size/2, line.y2 - size/2, size, size);
        }
      });

      // Desenhar o efeito de spotlight por cima
      const spotlightRadius = 100;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      
      // Criar máscara circular para o spotlight
      const gradient = ctx.createRadialGradient(
        mouseX, mouseY, 0,
        mouseX, mouseY, spotlightRadius
      );
      gradient.addColorStop(0, 'rgba(64, 153, 255, 0.4)');
      gradient.addColorStop(0.5, 'rgba(64, 153, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(64, 153, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      // Destacar linhas próximas ao mouse
      lines.forEach(line => {
        const midX = (line.x1 + line.x2) / 2;
        const midY = (line.y1 + line.y2) / 2;
        const dx = mouseX - midX;
        const dy = mouseY - midY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < spotlightRadius) {
          const intensity = 1 - (distance / spotlightRadius);
          ctx.beginPath();
          ctx.moveTo(line.x1, line.y1);
          ctx.lineTo(line.x2, line.y2);
          ctx.strokeStyle = `rgba(64, 153, 255, ${line.opacity + intensity * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Efeito de pulso nos nós próximos
          if (distance < 30) {
            const pulseSize = (1 - distance / 30) * 3;
            ctx.beginPath();
            ctx.arc(midX, midY, pulseSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(64, 153, 255, ${intensity * 0.5})`;
            ctx.fill();
          }
        }
      });

      ctx.restore();
    };

    // Animação
    let animationFrame: number;
    const animate = () => {
      draw();
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [mouseX, mouseY, containerWidth, containerHeight, lines]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}; 