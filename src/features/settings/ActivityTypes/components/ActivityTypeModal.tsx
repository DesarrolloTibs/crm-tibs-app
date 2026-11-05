import React from 'react';
import Modal from '@shared/components/Modal';
import { ActivityTypeForm } from './ActivityTypeForm';
import type { TypeActivity, ActivityTypeFormData } from '../schemas/activityTypes.schema';
import { Plus, Edit } from 'lucide-react';

interface ActivityTypeModalProps {
  open: boolean;
  editingType?: TypeActivity | null;
  onClose: () => void;
  onSubmit: (data: ActivityTypeFormData) => Promise<void>;
  submitting?: boolean;
}

export const ActivityTypeModal: React.FC<ActivityTypeModalProps> = ({
  open,
  editingType,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-lg"
      height="h-auto"
      className="rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
      padding="p-6 sm:p-7"
    >
      <div className="space-y-6">
        {/* Cabecera del Modal */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            {editingType ? <Edit size={20} /> : <Plus size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              {editingType ? 'Editar Tipo de Actividad' : 'Nuevo Tipo de Actividad'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editingType
                ? 'Actualiza el nombre o la disponibilidad de este tipo en la agenda.'
                : 'Define una nueva tipología para clasificar reuniones, llamadas y demos.'}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <ActivityTypeForm
          initialData={editingType}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      </div>
    </Modal>
  );
};
