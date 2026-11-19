import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  side?: 'right' | 'left';
  maxWidth?: string;
  padding?: string;
  hideCloseButton?: boolean;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  icon,
  side = 'right',
  maxWidth = 'max-w-3xl',
  padding = 'p-6',
  hideCloseButton = false,
  footer,
  className = '',
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isLeft = side === 'left';

  return (
    <div
      className={`fixed inset-0 z-50 flex ${isLeft ? 'justify-start' : 'justify-end'}`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} h-full bg-white shadow-2xl flex flex-col ${
          isLeft ? 'animate-slide-in-left' : 'animate-slide-in-right'
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || icon || !hideCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {icon}
              {title && (
                <h2 className="text-lg font-bold text-gray-800 truncate">{title}</h2>
              )}
            </div>
            {!hideCloseButton && (
              <Button
                variant="icon"
                onClick={onClose}
                className="!p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 shrink-0"
                aria-label="Cerrar panel"
                title="Cerrar"
              >
                <X size={20} />
              </Button>
            )}
          </div>
        )}

        <div className={`flex-1 overflow-y-auto ${padding}`}>{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawer;
