import React, { useState } from 'react';
import { uploadReceipt, downloadReceipt } from '../../services/expensesService';
import { Paperclip, X, Download } from 'lucide-react';
import type { Expense } from '../../core/models/Expense';
import Notification from '../Modal/Notification';
import Dropzone from '../shared/Dropzone';
import Button from '../shared/Button';

interface ReceiptUploadModalProps {
    expense: Expense;
    onClose: () => void;
    onUploadSuccess: () => void;
}

const ReceiptUploadModal: React.FC<ReceiptUploadModalProps> = ({ expense, onClose, onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const [notification, setNotification] = useState({
        show: false,
        type: 'success' as 'success' | 'error' | 'warning',
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const hideNotification = () => setNotification({ ...notification, show: false });

    const handleUpload = async () => {
        if (!selectedFile || !expense.id) return;

        setUploading(true);
        try {
            await uploadReceipt(expense.id, selectedFile);
            setNotification({ show: true, type: 'success', title: '¡Éxito!', message: 'Comprobante subido correctamente.', onConfirm: () => { hideNotification(); onUploadSuccess(); } });
        } catch (error) {
            setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudo subir el comprobante.', onConfirm: hideNotification });
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async () => {
        if (expense.id && expense.receiptUrl) {
            try {
                await downloadReceipt(expense.id, `comprobante-${expense.id}.jpg`);
            } catch (error) {
                setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudo descargar el comprobante.', onConfirm: hideNotification });
            }
        }
    };

    return (
        <div className="p-4">
            <Notification {...notification} onCancel={hideNotification} />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Subir Comprobante</h2>
            <p className="text-gray-600 mb-6">Para el gasto: <span className="font-semibold">{expense.concepto}</span></p>

            <Dropzone
                id="receipt-upload"
                accept="image/*"
                onFilesSelected={(files) => {
                    if (files && files[0]) {
                        const file = files[0];
                        if (!file.type.startsWith('image/')) {
                            setNotification({ show: true, type: 'error', title: 'Error', message: 'Solo se permiten archivos de imagen.', onConfirm: hideNotification });
                            return;
                        }
                        setSelectedFile(file);
                    }
                }}
                helpText="Arrastra y suelta tu comprobante aquí"
                buttonText="Seleccionar imagen"
            />

            {expense.receiptUrl && !selectedFile && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Comprobante Actual</h4>
                    <div className="flex items-center">
                        <button
                            onClick={handleDownload}
                            className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors"
                        >
                            <Download size={16} className="mr-2" />
                            Descargar Comprobante
                        </button>
                    </div>
                </div>
            )}

            {selectedFile && (
                <div className="mt-4 flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center truncate"><Paperclip size={18} className="text-gray-600 mr-2 flex-shrink-0" /> <span className="text-sm text-gray-800 truncate">{selectedFile.name}</span></div>
                    <button onClick={() => setSelectedFile(null)} className="p-1 text-gray-500 hover:text-red-600 rounded-full"><X size={18} /></button>
                </div>
            )}

            <div className="flex justify-end space-x-2 pt-6">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleUpload} disabled={!selectedFile} loading={uploading} variant="primary">Subir Comprobante</Button>
            </div>
        </div>
    );
};

export default ReceiptUploadModal;
