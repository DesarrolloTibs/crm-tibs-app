import React, { useEffect, useState } from 'react';
import { getOpportunityLabels, updateOpportunityLabel } from '../../services/opportunityLabelsService';
import type { OpportunityLabel } from '../../core/models/OpportunityLabel';
import Modal from '../Modal/Modal';
import Loader from '../Loader/Loader';
import { Pencil, Sliders } from 'lucide-react';
import Notification from '../Modal/Notification';

interface Props {
    onLabelsUpdated?: () => void;
}

const OpportunityLabelsSettings: React.FC<Props> = ({ onLabelsUpdated }) => {
    const [labels, setLabels] = useState<OpportunityLabel[]>([]);
    const [editing, setEditing] = useState<OpportunityLabel | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [loading, setLoading] = useState(false);

    const [notification, setNotification] = useState({
        show: false,
        type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
        title: '',
        message: '',
        onConfirm: () => {},
        onCancel: () => {},
    });

    const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));

    const fetchLabels = async () => {
        setLoading(true);
        try {
            const data = await getOpportunityLabels();
            setLabels(data);
        } catch (error) {
            setNotification({
                show: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar las etiquetas de oportunidad',
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabels();
    }, []);

    const openEditModal = (label: OpportunityLabel) => {
        setEditing(label);
        setEditingName(label.strname || '');
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        if (!editingName.trim()) {
            setNotification({
                show: true,
                type: 'error',
                title: 'Validación',
                message: 'El nombre de la etiqueta no puede estar vacío',
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
            return;
        }

        setLoading(true);
        try {
            await updateOpportunityLabel(editing.id, editingName.trim());
            setModalOpen(false);
            setNotification({
                show: true,
                type: 'success',
                title: '¡Éxito!',
                message: 'Etiqueta actualizada correctamente',
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
            fetchLabels();
            if (onLabelsUpdated) {
                onLabelsUpdated();
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'No se pudo actualizar la etiqueta';
            setNotification({
                show: true,
                type: 'error',
                title: 'Error',
                message: Array.isArray(msg) ? msg.join(', ') : msg,
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
        } finally {
            setLoading(false);
        }
    };

    const getFieldDescription = (id: string) => {
        switch (id) {
            case 'f509fa84-0b73-45f8-b3ab-b8471e98822e':
                return 'Esta etiqueta corresponde al campo donde se define el sector o línea de negocio de la oportunidad.';
            case '7d90d810-74d3-4613-882d-8e814a029db5':
                return 'Esta etiqueta corresponde al campo del tipo de entrega o modalidad de proyecto de la oportunidad.';
            case 'c6d3df39-53e7-40b9-8e2b-f1de16b5394f':
                return 'Esta etiqueta corresponde al campo de licenciamiento o plataforma tecnológica aplicada.';
            default:
                return 'Etiqueta de oportunidad editable en el sistema.';
        }
    };

    return (
        <>
            <Notification {...notification} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-100 pb-4 animate-fade-in text-left">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Sliders size={20} className="text-indigo-600" />
                        Etiquetas de Oportunidad
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Edita las etiquetas del bloque de Clasificación que visualizan los usuarios en el formulario de Oportunidades.
                    </p>
                </div>
            </div>

            {loading && labels.length === 0 ? (
                <Loader />
            ) : (
                <div className="border border-slate-150 rounded-xl overflow-x-auto bg-white shadow-sm max-w-4xl animate-fade-in text-left">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-4 pl-6">Nombre de la Etiqueta</th>
                                <th className="p-4 hidden sm:table-cell">Descripción / Mapeo</th>
                                <th className="p-4 pr-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                            {labels.map((label) => (
                                <tr key={label.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="p-4 pl-6 font-semibold text-slate-800">
                                        {label.strname}
                                    </td>
                                    <td className="p-4 text-slate-500 hidden sm:table-cell max-w-sm truncate text-xs">
                                        {getFieldDescription(label.id)}
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(label)}
                                            className="inline-flex items-center gap-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-600 font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all text-xs cursor-pointer"
                                            title="Editar etiqueta"
                                        >
                                            <Pencil size={12} />
                                            <span className="hidden sm:inline">Editar</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-md" height="h-auto">
                {editing && (
                    <form onSubmit={handleSave} className="space-y-5 p-2 text-left">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-150 pb-2.5 flex items-center gap-2">
                                <Pencil size={18} className="text-indigo-600" />
                                Editar Nombre de Etiqueta
                            </h3>
                            <p className="text-xs text-gray-500 mt-2">
                                Modifica el texto que se mostrará en el formulario.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase">
                                Nombre de Etiqueta
                            </label>
                            <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium"
                                placeholder="Escribe el nombre de la etiqueta..."
                                maxLength={100}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                            >
                                {loading && (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                <span>Guardar</span>
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
};

export default OpportunityLabelsSettings;
