import React from 'react';

interface SkeletonLineProps {
  className?: string;
}

const SkeletonLine: React.FC<SkeletonLineProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

interface SkeletonCardProps {
  lines?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3 }) => (
  <div className="animate-pulse bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
    <div className="h-4 bg-slate-200 rounded-lg w-2/3" />
    {Array.from({ length: lines - 1 }).map((_, i) => (
      <div key={i} className="h-3 bg-slate-100 rounded-lg w-full" />
    ))}
  </div>
);

interface SkeletonTableRowProps {
  columns: number;
}

const SkeletonTableRow: React.FC<SkeletonTableRowProps> = ({ columns }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-slate-100 rounded-lg animate-pulse" />
      </td>
    ))}
  </tr>
);

// ────────────────────────────────────────────────────

interface SkeletonLoaderProps {
  /** Tipo de skeleton a renderizar */
  variant?: 'line' | 'card' | 'table-row';
  /** Número de repeticiones */
  count?: number;
  /** Clase extra para el contenedor (aplica a 'line' y 'card') */
  className?: string;
  /** Número de columnas (solo aplica a 'table-row') */
  columns?: number;
  /** Número de líneas internas (solo aplica a 'card') */
  lines?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'line',
  count = 3,
  className = '',
  columns = 4,
  lines = 3,
}) => {
  if (variant === 'table-row') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonTableRow key={i} columns={columns} />
        ))}
      </>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} lines={lines} />
        ))}
      </div>
    );
  }

  // default: 'line'
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLine key={i} className={`h-4 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
};

export default SkeletonLoader;
