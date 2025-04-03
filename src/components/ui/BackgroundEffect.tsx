'use client';

import React, { useEffect, useState } from 'react';

export function BackgroundEffect() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Grid texture */}
      <div 
        className="pointer-events-none fixed inset-0 z-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(138, 99, 244, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(138, 99, 244, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, 
            black 20%, 
            rgba(0, 0, 0, 0.8) 25%, 
            rgba(0, 0, 0, 0.6) 30%, 
            rgba(0, 0, 0, 0.4) 35%, 
            rgba(0, 0, 0, 0.2) 40%, 
            transparent 50%
          )`
        }}
      />

      {/* Dots texture */}
      <div 
        className="pointer-events-none fixed inset-0 z-0" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1' fill='%238A63F4' fill-opacity='0.05'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
          maskImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, 
            black 30%, 
            rgba(0, 0, 0, 0.8) 35%, 
            rgba(0, 0, 0, 0.6) 40%, 
            rgba(0, 0, 0, 0.4) 45%, 
            rgba(0, 0, 0, 0.2) 50%, 
            transparent 60%
          )`
        }}
      />

      {/* Light effect following mouse */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(1000px circle at ${mousePosition.x}px ${mousePosition.y}px, 
            rgba(138, 99, 244, 0.15), 
            rgba(138, 99, 244, 0.1) 20%, 
            rgba(138, 99, 244, 0.05) 30%, 
            transparent 50%
          )`,
        }}
      />

      {/* Static gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(138, 99, 244, 0.1) 0%, transparent 100%)',
          backgroundSize: '100% 100%',
          backgroundPosition: '50% 0%'
        }}
      />
    </>
  );
} 