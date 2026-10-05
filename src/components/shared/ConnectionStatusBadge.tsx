import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusBadgeProps {
  isConnected: boolean;
  showLabel?: boolean;
  className?: string;
}

const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  isConnected,
  showLabel = true,
  className = '',
}) => {
  if (isConnected) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs select-none transition-colors ${className}`}
        title="Conexión WebSocket activa y sincronizada en tiempo real"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        {showLabel && <span>En vivo</span>}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs select-none animate-pulse transition-colors ${className}`}
      title="Conexión en tiempo real temporalmente interrumpida. Intentando reconectar automáticamente..."
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      {showLabel && <span>Reconectando...</span>}
    </div>
  );
};

export default ConnectionStatusBadge;
