import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getInteractionsByOpportunity,
  createInteraction,
  deleteInteraction,
} from '../../../../services/interactionsService';
import { Plus, Search, Trash2, MessageSquare } from 'lucide-react';
import type { Interaction } from '../../../../core/models/Interaction';
import { useAuth } from '../../../../hooks/useAuth';
import Notification from '../../../../components/shared/Notification';
import Modal from '../../../../components/shared/Modal';
import Button from '../../../../components/shared/Button';
import Input from '../../../../components/shared/Input';
import TextArea from '../../../../components/shared/TextArea';
import Loader from '../../../../components/shared/Loader';

export interface OpportunityInteractionsTabProps {
  opportunityId: string;
}

export type InteractionsTabProps = OpportunityInteractionsTabProps;

export const OpportunityInteractionsTab: React.FC<OpportunityInteractionsTabProps> = ({
  opportunityId,
}) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newInteractionComment, setNewInteractionComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = () => setNotification((prev) => ({ ...prev, show: false }));

  const isFetchingRef = useRef<boolean>(false);

  const fetchInteractions = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const data = await getInteractionsByOpportunity(opportunityId);
      setInteractions(data);
    } catch (error) {
      console.error('Error fetching interactions:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar el historial.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [opportunityId]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const handleAddInteraction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newInteractionComment.trim()) {
      setNotification({
        show: true,
        type: 'warning',
        title: 'Atención',
        message: 'El comentario es obligatorio.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      return;
    }

    setSaving(true);
    try {
      await createInteraction({
        comment: newInteractionComment.trim(),
        opportunity_id: opportunityId,
      });
      setNewInteractionComment('');
      setModalOpen(false);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: 'Registro añadido al historial.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      fetchInteractions();
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo añadir el registro.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    setNotification({
      show: true,
      type: 'confirmation',
      title: '¿Estás seguro?',
      message: 'No podrás revertir esta acción.',
      onConfirm: async () => {
        try {
          await deleteInteraction(interactionId);
          setNotification({
            show: true,
            type: 'success',
            title: 'Eliminado',
            message: 'El registro ha sido eliminado.',
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
          fetchInteractions();
        } catch (error) {
          setNotification({
            show: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo eliminar el registro.',
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
        }
      },
      onCancel: hideNotification,
    });
  };

  const filteredInteractions = interactions.filter((interaction) =>
    interaction.comment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full max-h-[80vh]">
      <Notification {...notification} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex-grow w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Buscar en el historial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputPrefix={<Search size={18} className="text-slate-400" />}
            className="!py-2 !px-3 !rounded-xl !text-sm"
          />
        </div>
        <Button
          type="button"
          variant="indigo"
          className="!py-2.5 !px-5 !text-sm !font-bold shrink-0"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={18} /> Nuevo Registro
        </Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-lg">
        <h2 className="text-lg font-bold mb-4 text-slate-800 border-b border-slate-150 pb-3 flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-600" /> Añadir al Historial
        </h2>
        <div className="space-y-4">
          <TextArea
            id="newInteractionComment"
            label="Nuevo Comentario"
            value={newInteractionComment}
            onChange={(e) => setNewInteractionComment(e.target.value)}
            placeholder="Añadir un comentario o registrar un evento..."
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              className="!py-2 !px-4 !text-sm font-semibold"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="indigo"
              className="!py-2 !px-5 !text-sm font-semibold"
              loading={saving}
              onClick={() => handleAddInteraction()}
            >
              Guardar Registro
            </Button>
          </div>
        </div>
      </Modal>

      <ul className="space-y-3 overflow-y-auto flex-grow pr-2">
        {filteredInteractions.map((interaction) => (
          <li
            key={interaction.id}
            className="p-4 bg-white rounded-xl shadow-2xs border border-slate-200/80 flex justify-between items-center transition-all hover:border-slate-300 hover:shadow-xs"
          >
            <div className="flex-grow mr-4 min-w-0">
              <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap break-words">
                {interaction.comment}
              </p>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">
                {new Date(interaction.createdAt).toLocaleString('es-MX', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {isAdmin && (
              <Button
                variant="icon"
                onClick={() => handleDeleteInteraction(interaction.id)}
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 !p-2 ml-2 shrink-0"
                aria-label="Eliminar registro del historial"
                title="Eliminar registro del historial"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </li>
        ))}
        {filteredInteractions.length === 0 &&
          (interactions.length > 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-slate-150">
              <p className="text-sm font-medium">
                No se encontraron registros que coincidan con la búsqueda.
              </p>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-slate-150">
              <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">
                No hay registros en el historial para esta oportunidad.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ¡Añade uno para llevar la trazabilidad del trato!
              </p>
            </div>
          ))}
      </ul>
    </div>
  );
};

export const InteractionsTab = OpportunityInteractionsTab;
export default OpportunityInteractionsTab;
