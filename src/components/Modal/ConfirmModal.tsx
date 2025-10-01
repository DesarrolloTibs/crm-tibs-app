import React from 'react';

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, onClose, onConfirm, message }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 min-w-[350px] relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    &times;
                </button>
                <div className="mb-4 text-lg">{message}</div>
                <div className="flex justify-end space-x-2">
                    <button
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        onClick={onConfirm}
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;