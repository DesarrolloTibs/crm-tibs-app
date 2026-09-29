import React from 'react';
import Modal from '../../../../components/shared/Modal';
import { DashboardIndicatorForm } from './DashboardIndicatorForm';
import type { DashboardIndicator, DashboardIndicatorFormData } from '../schemas/dashboardIndicators.schema';

interface DashboardIndicatorModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: DashboardIndicator | null;
  onSubmit: (data: DashboardIndicatorFormData) => Promise<void>;
  submitting?: boolean;
  activeModule: 'commercial' | 'support';
  stages: Array<{ id: string; strname: string }>;
}

export const DashboardIndicatorModal: React.FC<DashboardIndicatorModalProps> = ({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
  activeModule,
  stages,
}) => {
  const isEditing = Boolean(initialData?.id);

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg" height="h-auto">
      <div className="mb-4 pr-6">
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
          {isEditing ? 'Editar Indicador KPI' : 'Crear Indicador KPI'}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {isEditing
            ? 'Modifica el nombre, tipo de cálculo, color o etapas asociadas para esta tarjeta métrica.'
            : 'Configura una nueva tarjeta de analítica en tiempo real para visualizar en el Dashboard principal.'}
        </p>
      </div>

      <DashboardIndicatorForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onClose}
        submitting={submitting}
        activeModule={activeModule}
        stages={stages}
      />
    </Modal>
  );
};
