import React, { useEffect, useState } from 'react';

export const PreLoader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    // Inicia a transformação após 1.5 segundos
    const transformTimer = setTimeout(() => {
      setIsTransforming(true);
    }, 1500);

    // Inicia o slide para cima após 2.3 segundos
    const slideTimer = setTimeout(() => {
      setIsSliding(true);
    }, 2300);

    // Remove o preloader após 3 segundos
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(transformTimer);
      clearTimeout(slideTimer);
      clearTimeout(loadingTimer);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div 
      className={`fixed inset-0 bg-[#030617] z-50 transition-all duration-700 ease-in-out
        ${isSliding ? '-translate-y-full' : 'translate-y-0'}
        ${!isLoading ? 'pointer-events-none' : ''}`}
    >
      <div className="h-full flex items-center justify-center">
        {/* Loading/Logo Animation */}
        <div className={`relative h-16 w-16 transition-transform duration-700 ${!isLoading ? '-translate-x-4' : ''}`}>
          {/* Loading Spinner */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${isTransforming ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-16 h-16 rounded-full border-4 border-[#1e2235] border-t-[#8A63F4] animate-spin">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#8A63F4]" />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${isTransforming ? 'opacity-100' : 'opacity-0'}`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full rotate-[-45deg]"
            >
              <path
                d="M17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17"
                className="stroke-[#8A63F4]"
                strokeWidth="3"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: isTransforming ? 0 : 100,
                  transition: 'stroke-dashoffset 0.5s ease'
                }}
              />
              <circle
                cx="12"
                cy="12"
                r="3"
                className={`fill-[#a47ef8] transition-transform duration-300 ${isTransforming ? 'scale-100' : 'scale-0'}`}
              />
            </svg>
          </div>
        </div>

        {/* Text Animation */}
        <h1 
          className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8A63F4] to-[#a47ef8] ml-4"
          style={{
            backgroundSize: isTransforming ? '100% 100%' : '0% 100%',
            backgroundRepeat: 'no-repeat',
            transition: 'background-size 0.8s ease'
          }}
        >
          Clonify
        </h1>
      </div>
    </div>
  );
}; 