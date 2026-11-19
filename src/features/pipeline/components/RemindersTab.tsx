import React, { useState, useEffect } from 'react';
import {
  getRemindersByOpportunity,
  createReminder,
  deleteReminder,
} from '@core/services/remindersService';
import { Plus, Search, Trash2 } from 'lucide-react';
import type { Reminder } from '@core/models/Reminder';
import { useAuth } from '@features/auth';
import Notification from '@shared/components/Notification';
import Modal from '@shared/components/Modal';
import Input from '@shared/components/Input';
import Button from '@shared/components/Button';

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

  const [modalOpen, setModalOpen] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'loading' | 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = () => setNotification({ ...notification, show: false });

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await getRemindersByOpportunity(opportunityId);
      setReminders(data);
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los recordatorios.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      console.error('Error fetching reminders:', error);
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
      setNotification({
        show: true,
        type: 'warning',
        title: 'Atención',
        message: 'El título y la fecha son obligatorios.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      return;
    }

    try {
      setNotification({
        show: true,
        type: 'loading',
        title: 'Guardando recordatorio...',
        message: 'Programando el recordatorio en la oportunidad.',
        onConfirm: () => {},
        onCancel: () => {},
      });
      await createReminder({
        title: newReminderTitle,
        date: new Date(newReminderDate).toISOString(),
        opportunity_id: opportunityId,
      });
      setNewReminderTitle('');
      setNewReminderDate('');
      setModalOpen(false);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: 'Recordatorio creado.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      fetchReminders(); // Recargar la lista
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear el recordatorio.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    setNotification({
      show: true,
      type: 'confirmation',
      title: '¿Estás seguro?',
      message: 'No podrás revertir esta acción.',
      onConfirm: async () => {
        setNotification({
          show: true,
          type: 'loading',
          title: 'Eliminando recordatorio...',
          message: 'Retirando el recordatorio programado.',
          onConfirm: () => {},
          onCancel: () => {},
        });
        try {
          await deleteReminder(reminderId);
          setNotification({
            show: true,
            type: 'success',
            title: 'Eliminado',
            message: 'El recordatorio ha sido eliminado.',
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
          fetchReminders(); // Recargar la lista
        } catch (error) {
          setNotification({
            show: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo eliminar el recordatorio.',
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
        }
      },
      onCancel: hideNotification,
    });
  };

  const filteredReminders = reminders.filter(reminder =>
    reminder.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) return <p>Cargando recordatorios...</p>;

  return (
    <div className="p-4 flex flex-col h-full max-h-[80vh]">
      <Notification {...notification} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <Input
          type="text"
          placeholder="Buscar en recordatorios..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          clearTitle="Limpiar búsqueda"
          inputPrefix={<Search size={16} />}
          containerClassName="flex-grow w-full sm:w-auto"
          className="!pl-10 bg-white"
        />
        <Button
          size="sm"
          variant="success"
          className="gap-2 w-full sm:w-auto shadow-sm whitespace-nowrap hover:translate-y-0 !text-sm !font-medium"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={18} /> Nuevo Recordatorio
        </Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
          Añadir Recordatorio
        </h2>
        <form onSubmit={handleAddReminder} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Input
              id="newReminderTitle"
              label="Título del Recordatorio"
              type="text"
              value={newReminderTitle}
              onChange={e => setNewReminderTitle(e.target.value)}
              placeholder="Ej: Llamar al cliente para seguimiento"
              className="bg-white"
            />
            <Input
              id="newReminderDate"
              label="Fecha y Hora"
              type="datetime-local"
              value={newReminderDate}
              onChange={e => setNewReminderDate(e.target.value)}
              className="bg-white appearance-none min-w-0"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="rounded-md !text-sm !font-normal hover:translate-y-0"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              type="submit"
              variant="primary"
              className="rounded-md !text-sm !font-medium shadow-none hover:translate-y-0"
            >
              Guardar Recordatorio
            </Button>
          </div>
        </form>
      </Modal>

      <ul className="space-y-4 overflow-y-auto flex-grow pr-2">
        {filteredReminders.map(reminder => (
          <li
            key={reminder.id}
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex justify-between items-center transition-shadow hover:shadow-md"
          >
            <div className="flex-grow">
              <p className="font-semibold text-gray-800 text-base">{reminder.title}</p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(reminder.date).toLocaleString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {isAdmin && ( // Solo los administradores pueden eliminar recordatorios
              <Button
                variant="ghost-danger"
                onClick={() => handleDeleteReminder(reminder.id)}
                className="!p-2 hover:!bg-red-100 !rounded-full ml-4"
                title="Eliminar recordatorio"
              >
                <Trash2 size={20} />
              </Button>
            )}
          </li>
        ))}
        {filteredReminders.length === 0 &&
          (reminders.length > 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No se encontraron recordatorios que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              <p>No hay recordatorios programados para esta oportunidad.</p>
              <p className="text-sm mt-1">¡Añade uno para no perder detalle!</p>
            </div>
          ))}
      </ul>
    </div>
  );
};

export default RemindersTab;
