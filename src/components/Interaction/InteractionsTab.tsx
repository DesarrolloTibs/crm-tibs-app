import React, { useState, useEffect } from 'react';
import { getInteractionsByOpportunity, createInteraction, deleteInteraction } from '../../services/interactionsService'; // Asumiendo que se movió a src/services
import { Plus, Search, Trash2 } from 'lucide-react';
import type { Interaction } from '../../core/models/Interaction';
import { useAuth } from '../../hooks/useAuth';
import Notification from '../Modal/Notification';
import Modal from '../Modal/Modal';
import Button from '../shared/Button';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
interface InteractionsTabProps {
  opportunityId: string;
}

const InteractionsTab: React.FC<InteractionsTabProps> = ({ opportunityId }) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [newInteractionComment, setNewInteractionComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => { },
    onCancel: () => { },
  });

  const hideNotification = () => setNotification({ ...notification, show: false });


  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const data = await getInteractionsByOpportunity(opportunityId);
      setInteractions(data);
    } catch (error) {
      console.error("Error fetching interactions:", error);
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
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, [opportunityId]);

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInteractionComment) {
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

    try {
      await createInteraction({
        comment: newInteractionComment,
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
      fetchInteractions(); // Recargar la lista
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo añadir el registro.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
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
          setNotification({ show: true, type: 'success', title: 'Eliminado', message: 'El registro ha sido eliminado.', onConfirm: hideNotification, onCancel: hideNotification });
          fetchInteractions();
        } catch (error) {
          setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudo eliminar el registro.', onConfirm: hideNotification, onCancel: hideNotification });
        }
      },
      onCancel: hideNotification,
    });
  };

  const filteredInteractions = interactions.filter(interaction =>
    interaction.comment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Cargando historial...</p>;

  return (
    <div className="p-4 flex flex-col h-full max-h-[80vh]">
      <Notification {...notification} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex-grow w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Buscar en el historial..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            inputPrefix={<Search size={20} />}
          />
        </div>
        <Button
          type="submit"
          variant="success"
          className="px-6 py-3"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={18} /> Nuevo Registro
        </Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Añadir al Historial</h2>
        <form onSubmit={handleAddInteraction} className="space-y-4">
          <div>
            <TextArea
              id="newInteractionComment"
              label="Nuevo Comentario"
              value={newInteractionComment}
              onChange={e => setNewInteractionComment(e.target.value)}
              placeholder="Añadir un comentario o registrar un evento..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">

            <Button
              type="button"
              variant="secondary"
              className="px-6 py-3"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>


            <Button
              type="submit"
              variant="primary"
              className="px-6 py-3"
            >
              Guardar Registro
            </Button>

          </div>
        </form>
      </Modal>

      <ul className="space-y-4 overflow-y-auto flex-grow pr-2">
        {filteredInteractions.map(interaction => (
          <li key={interaction.id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex justify-between items-center transition-shadow hover:shadow-md">
            <div className="flex-grow mr-4">
              <p className="text-base text-gray-800">{interaction.comment}</p>
              <p className="text-sm text-gray-500 mt-1">{new Date(interaction.createdAt).toLocaleString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleDeleteInteraction(interaction.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors ml-4"
                aria-label="Eliminar registro del historial"
                title="Eliminar registro del historial"
              >
                <Trash2 size={20} />
              </button>
            )}
          </li>
        ))}
        {filteredInteractions.length === 0 && (
          interactions.length > 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No se encontraron registros que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              <p>No hay registros en el historial para esta oportunidad.</p>
              <p className="text-sm mt-1">¡Añade uno para no perder detalle!</p>
            </div>
          )
        )}
      </ul>
    </div>
  );
};

export default InteractionsTab;