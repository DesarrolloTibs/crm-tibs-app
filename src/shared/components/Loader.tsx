import React from 'react';

export interface LoaderProps {
  /** Altura del contenedor (ej. h-40) o clases extra en modo inline. */
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Si es true renderiza solo el SVG sin el contenedor flex centrado (útil dentro de botones o celdas). */
  inline?: boolean;
  /** Clase Tailwind para el color del spinner. */
  colorClassName?: string;
}

const sizeMap = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const Loader: React.FC<LoaderProps> = ({
  className = '',
  size = 'md',
  inline = false,
  colorClassName = 'text-blue-600',
}) => {
  const svg = (
    <svg
      className={`animate-spin ${sizeMap[size]} ${colorClassName} ${inline ? className : ''}`}
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
  );

  if (inline) {
    return svg;
  }

  return (
    <div className={`flex justify-center items-center ${className || 'h-40'}`}>
      {svg}
    </div>
  );
};

export default Loader;
