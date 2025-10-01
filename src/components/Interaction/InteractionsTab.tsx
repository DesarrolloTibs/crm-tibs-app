import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getInteractionsByOpportunity, createInteraction, deleteInteraction } from '../../services/interactionsService'; // Asumiendo que se movió a src/services
import { Plus, Trash2 } from 'lucide-react';
import type { Interaction } from '../../core/models/Interaction';
interface InteractionsTabProps {
  opportunityId: string;
}

const InteractionsTab: React.FC<InteractionsTabProps> = ({ opportunityId }) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [newInteractionComment, setNewInteractionComment] = useState('');

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const data = await getInteractionsByOpportunity(opportunityId);
      setInteractions(data);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      Swal.fire('Error', 'No se pudieron cargar las interacciones.', 'error');
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
      Swal.fire('Atención', 'El comentario es obligatorio.', 'warning');
      return;
    }

    try {
      await createInteraction({
        comment: newInteractionComment,
        opportunity_id: opportunityId,
      });
      setNewInteractionComment('');
      Swal.fire('¡Éxito!', 'Interacción creada.', 'success');
      fetchInteractions(); // Recargar la lista
    } catch (error) {
      Swal.fire('Error', 'No se pudo crear la interacción.', 'error');
    }
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, ¡elimínala!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteInteraction(interactionId);
        Swal.fire('Eliminada', 'La interacción ha sido eliminada.', 'success');
        fetchInteractions(); // Recargar la lista
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar la interacción.', 'error');
      }
    }
  };

  if (loading) return <p>Cargando interacciones...</p>;

  return (
    <div>
      <form onSubmit={handleAddInteraction} className="flex gap-4 mb-6 items-end">
        <textarea value={newInteractionComment} onChange={e => setNewInteractionComment(e.target.value)} placeholder="Añadir un comentario..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm flex-grow" rows={2}></textarea>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 self-start"><Plus size={18} /> Añadir</button>
      </form>

      <ul className="space-y-3">
        {interactions.map(interaction => (
          <li key={interaction.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
            <div className="flex-grow mr-4">
              <p className="text-sm text-gray-800">{interaction.comment}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(interaction.createdAt).toLocaleString()}</p>
            </div>
            <button
              onClick={() => handleDeleteInteraction(interaction.id)}
              className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors duration-200"
              aria-label="Eliminar interacción"
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
        {interactions.length === 0 && <p className="text-gray-500">No hay interacciones para esta oportunidad.</p>}
      </ul>
    </div>
  );
};

export default InteractionsTab;