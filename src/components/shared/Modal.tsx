import React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  height?: string;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  maxWidth = 'max-w-4xl',
  height = 'h-[95vh]',
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-2 sm:p-4 transition-opacity cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${maxWidth} ${height} relative flex flex-col cursor-default`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full p-1.5 transition-colors z-10"
        >
          <X size={24} />
        </button>
        <div className="p-4 sm:p-6 flex-grow h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
