import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[350px] max-w-sm w-full relative">
        <Button
          variant="icon"
          className="absolute top-3 right-3 !text-gray-400 hover:!text-gray-700 !rounded-full !p-1"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={18} />
        </Button>
        <div className="mb-5 text-base text-slate-700 leading-relaxed pr-4">{message}</div>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-xl bg-slate-100 border-transparent hover:bg-slate-200"
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className={`rounded-xl shadow-none hover:translate-y-0 ${
              variant === 'warning' ? '!bg-yellow-500 hover:!bg-yellow-600' : ''
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
