import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getRemindersByOpportunity, createReminder, deleteReminder } from '../../services/remindersService';
import { Plus, Trash2 } from 'lucide-react';
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

  if (loading) return <p>Cargando recordatorios...</p>;

  return (
    <div>
      <form onSubmit={handleAddReminder} className="flex gap-4 mb-6 items-end">
        <div className="flex-grow">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título</label>
          <input type="text" value={newReminderTitle} onChange={e => setNewReminderTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Fecha</label>
          <input type="datetime-local" value={newReminderDate} onChange={e => setNewReminderDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Añadir</button>
      </form>

      <ul className="space-y-3">
        {reminders.map(reminder => (
          <li key={reminder.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
            <div>
              <p className="font-semibold">{reminder.title}</p>
              <p className="text-sm text-gray-500">{new Date(reminder.date).toLocaleString()}</p>
            </div>
            {isAdmin && (
              <button onClick={() => handleDeleteReminder(reminder.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
            )}
          </li>
        ))}
        {reminders.length === 0 && <p className="text-gray-500">No hay recordatorios para esta oportunidad.</p>}
      </ul>
    </div>
  );
};

export default RemindersTab;