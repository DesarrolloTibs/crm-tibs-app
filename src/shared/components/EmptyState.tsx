import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Sin resultados',
  message = 'No hay registros que mostrar.',
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        {icon ?? <Inbox className="w-7 h-7 text-slate-400" />}
      </div>
      <p className="text-base font-semibold text-slate-700 mb-1">{title}</p>
      <p className="text-sm text-slate-400 max-w-xs">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
