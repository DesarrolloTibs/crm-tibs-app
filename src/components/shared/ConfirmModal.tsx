import React from 'react';

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

  const confirmStyles =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-yellow-500 hover:bg-yellow-600 text-white';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[350px] max-w-sm w-full relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl leading-none"
          onClick={onClose}
          aria-label="Cerrar"
        >
          &times;
        </button>
        <div className="mb-5 text-base text-slate-700 leading-relaxed">{message}</div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${confirmStyles}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
