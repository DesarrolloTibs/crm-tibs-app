import React from 'react';

interface LoaderProps {
  /** Altura del contenedor. Por defecto h-40. */
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const Loader: React.FC<LoaderProps> = ({ className = 'h-40', size = 'md' }) => (
  <div className={`flex justify-center items-center ${className}`}>
    <svg
      className={`animate-spin ${sizeMap[size]} text-blue-600`}
      viewBox="0 0 24 24"
      aria-label="Cargando..."
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  </div>
);

export default Loader;
