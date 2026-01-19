
import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Abstract "P" and "Workflow" Shape */}
        <path 
          d="M30 20C30 14.4772 34.4772 10 40 10H70C75.5228 10 80 14.4772 80 20V40C80 45.5228 75.5228 50 70 50H40C34.4772 50 30 45.5228 30 40V20Z" 
          fill="url(#logo-gradient-primary)" 
        />
        <path 
          d="M20 50C20 44.4772 24.4772 40 30 40H60C65.5228 40 70 44.4772 70 50V70C70 81.0457 61.0457 90 50 90H30C24.4772 90 20 85.5228 20 80V50Z" 
          fill="url(#logo-gradient-secondary)"
          fillOpacity="0.9"
        />
        <defs>
          <linearGradient id="logo-gradient-primary" x1="30" y1="10" x2="80" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="logo-gradient-secondary" x1="20" y1="40" x2="70" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4f46e5" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
