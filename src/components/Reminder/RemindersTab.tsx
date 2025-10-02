import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getRemindersByOpportunity, createReminder, deleteReminder } from '../../services/remindersService';
import { Plus, Search, Trash2 } from 'lucide-react';
import type { Reminder } from '../../core/models/Reminder';
import { useAuth } from '../../hooks/useAuth';

interface RemindersTabProps {
  opportunityId: string;
}

const RemindersTab: React.FC<RemindersTabProps> = ({ opportunityId }) => {
  const { isAdmin } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await getRemindersByOpportunity(opportunityId);
      setReminders(data);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      Swal.fire('Error', 'No se pudieron cargar los recordatorios.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [opportunityId]);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle || !newReminderDate) {
      Swal.fire('Atención', 'El título y la fecha son obligatorios.', 'warning');
      return;
    }

    try {
      await createReminder({
        title: newReminderTitle,
        date: new Date(newReminderDate).toISOString(),
        opportunity_id: opportunityId,
      });
      setNewReminderTitle('');
      setNewReminderDate('');
      Swal.fire('¡Éxito!', 'Recordatorio creado.', 'success');
      fetchReminders(); // Recargar la lista
    } catch (error) {
      Swal.fire('Error', 'No se pudo crear el recordatorio.', 'error');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, ¡eliminar!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteReminder(reminderId);
        Swal.fire('Eliminado', 'El recordatorio ha sido eliminado.', 'success');
        fetchReminders(); // Recargar la lista
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el recordatorio.', 'error');
      }
    }
  };

  const filteredReminders = reminders.filter(reminder =>
    reminder.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Cargando recordatorios...</p>;

  return (
    <div className="p-4 flex flex-col h-full max-h-[70vh]">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Gestionar Recordatorios</h3>
      
      <form onSubmit={handleAddReminder} className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="newReminderTitle" className="block text-sm font-medium text-gray-700 mb-1">Título del Recordatorio</label>
            <input 
              id="newReminderTitle" 
              type="text" 
              value={newReminderTitle} 
              onChange={e => setNewReminderTitle(e.target.value)} 
              placeholder="Ej: Llamar al cliente para seguimiento"
              className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" 
            />
          </div>
          <div>
            <label htmlFor="newReminderDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
            <input 
              id="newReminderDate" 
              type="datetime-local" 
              value={newReminderDate} 
              onChange={e => setNewReminderDate(e.target.value)} 
              className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" 
            />
          </div>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 mt-4">
          <Plus size={18} /> Añadir Recordatorio
        </button>
      </form>

      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
          <Search size={20} />
        </span>
        <input
          type="text"
          placeholder="Buscar en recordatorios..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border rounded pl-10 pr-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <ul className="space-y-4 overflow-y-auto flex-grow pr-2">
        {filteredReminders.map(reminder => (
          <li key={reminder.id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex justify-between items-center transition-shadow hover:shadow-md">
            <div className="flex-grow">
              <p className="font-semibold text-gray-800 text-base">{reminder.title}</p>
              <p className="text-sm text-gray-500 mt-1">{new Date(reminder.date).toLocaleString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {isAdmin && ( // Solo los administradores pueden eliminar recordatorios
              <button 
                onClick={() => handleDeleteReminder(reminder.id)} 
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors ml-4"
                title="Eliminar recordatorio"
              >
                <Trash2 size={20} />
              </button>
            )}
          </li>
        ))}
        {filteredReminders.length === 0 && (
          reminders.length > 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No se encontraron recordatorios que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              <p>No hay recordatorios programados para esta oportunidad.</p>
              <p className="text-sm mt-1">¡Añade uno para no perder detalle!</p>
            </div>
          )
        )}
      </ul>
    </div>
  );
};

export default RemindersTab;