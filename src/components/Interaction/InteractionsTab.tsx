import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getInteractionsByOpportunity, createInteraction, deleteInteraction } from '../../services/interactionsService'; // Asumiendo que se movió a src/services
import { Plus, Search, Trash2 } from 'lucide-react';
import type { Interaction } from '../../core/models/Interaction';
import { useAuth } from '../../hooks/useAuth';
interface InteractionsTabProps {
  opportunityId: string;
}

const InteractionsTab: React.FC<InteractionsTabProps> = ({ opportunityId }) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [newInteractionComment, setNewInteractionComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const data = await getInteractionsByOpportunity(opportunityId);
      setInteractions(data);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      Swal.fire('Error', 'No se pudo cargar el historial.', 'error');
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
      Swal.fire('¡Éxito!', 'Registro añadido al historial.', 'success');
      fetchInteractions(); // Recargar la lista
    } catch (error) {
      Swal.fire('Error', 'No se pudo añadir el registro.', 'error');
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
        Swal.fire('Eliminado', 'El registro ha sido eliminado.', 'success');
        fetchInteractions(); // Recargar la lista
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
      }
    }
  };

  const filteredInteractions = interactions.filter(interaction =>
    interaction.comment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Cargando historial...</p>;

  return (
    <div className="p-4 flex flex-col h-full max-h-[80vh]">
      {/* <h3 className="text-xl font-semibold text-gray-800 mb-4">Historial</h3> */}

      <form onSubmit={handleAddInteraction} className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div>
          <label htmlFor="newInteractionComment" className="block text-sm font-medium text-gray-700 mb-1">Nuevo Comentario</label>
          <textarea 
            id="newInteractionComment"
            value={newInteractionComment} 
            onChange={e => setNewInteractionComment(e.target.value)} 
            placeholder="Añadir un comentario o registrar un evento..." 
            className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" 
            rows={3}
          ></textarea>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 mt-2">
          <Plus size={18} /> Añadir al Historial
        </button>
      </form>

      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
          <Search size={20} />
        </span>
        <input
          type="text"
          placeholder="Buscar en el historial..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border rounded pl-10 pr-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

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