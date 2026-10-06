import React from 'react';
import Modal from '../../../components/shared/Modal';
import { ActivityForm } from './ActivityForm';
import type {
  Activity,
  TypeActivity,
  Opportunity,
  Client,
  Company,
} from '../schemas/activities.schema';
import { Edit, CalendarPlus } from 'lucide-react';

interface ActivityModalProps {
  open: boolean;
  editingActivity?: Partial<Activity> | null;
  activityTypes: TypeActivity[];
  onClose: () => void;
  onSubmit: (data: Partial<Activity>) => Promise<void> | void;
  submitting?: boolean;
  opportunities?: Opportunity[];
  clients?: Client[];
  companies?: Company[];
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  open,
  editingActivity,
  activityTypes,
  onClose,
  onSubmit,
  submitting = false,
  opportunities,
  clients,
  companies,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-2xl"
      height="max-h-[90vh] h-auto"
      className="rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
      padding="p-0"
    >
      <div className="flex flex-col max-h-[90vh] h-full overflow-hidden">
        {/* Cabecera Fija del Modal */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 sm:px-7 z-20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              {editingActivity?.id ? <Edit size={20} /> : <CalendarPlus size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {editingActivity?.id
                  ? `Editar Actividad: ${editingActivity.activity || 'Sin título'}`
                  : 'Nueva Cita o Actividad'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {editingActivity?.id
                  ? 'Modifica los horarios, empresa o contactos asociados y recordatorio de la actividad.'
                  : 'Agenda un nuevo compromiso, reunión de seguimiento, demo o llamada comercial.'}
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo Scrolleable del Formulario */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7">
          <ActivityForm
            initialData={editingActivity}
            activityTypes={activityTypes}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitting={submitting}
            opportunities={opportunities}
            clients={clients}
            companies={companies}
          />
        </div>
      </div>
    </Modal>
  );
};
