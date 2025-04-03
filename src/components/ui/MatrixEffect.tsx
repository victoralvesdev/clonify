import React, { useEffect, useRef } from 'react';

interface MatrixEffectProps {
  mouseX: number;
  mouseY: number;
  containerWidth: number;
  containerHeight: number;
}

export const MatrixEffect: React.FC<MatrixEffectProps> = ({ mouseX, mouseY, containerWidth, containerHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Usar o tamanho do container ao invés da tela toda
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    const characters = '01';
    const fontSize = 10;
    const columns = canvas.width / fontSize;
    
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -20;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#8A63F4';
      ctx.font = `${fontSize}px monospace`;

      // Área de influência do mouse
      const mouseRadius = 50;
      
      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Distância do caractere até o mouse
        const dx = x - mouseX;
        const dy = y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Velocidade baseada na distância do mouse
        let speed = 0.5;
        if (distance < mouseRadius) {
          speed = 2;
        }

        const char = characters[Math.floor(Math.random() * characters.length)];
        
        // Cor baseada na proximidade do mouse
        if (distance < mouseRadius) {
          ctx.fillStyle = '#a47ef8';
        } else {
          ctx.fillStyle = 'rgba(138, 99, 244, 0.5)';
        }
        
        ctx.fillText(char, x, y);

        if (y > canvas.height) {
          drops[i] = 0;
        }

        drops[i] += speed;
      }
    };

    const interval = setInterval(draw, 50);

    return () => clearInterval(interval);
  }, [mouseX, mouseY, containerWidth, containerHeight]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}; 