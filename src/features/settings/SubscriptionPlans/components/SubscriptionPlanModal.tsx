import React from 'react';
import Modal from '@shared/components/Modal';
import { SubscriptionPlanForm } from './SubscriptionPlanForm';
import type { Plan, SubscriptionPlanFormData } from '../schemas/subscriptionPlans.schema';
import { Edit, Layers } from 'lucide-react';

interface SubscriptionPlanModalProps {
  open: boolean;
  editingPlan?: Plan | null;
  onClose: () => void;
  onSubmit: (data: SubscriptionPlanFormData) => Promise<void>;
  submitting?: boolean;
}

export const SubscriptionPlanModal: React.FC<SubscriptionPlanModalProps> = ({
  open,
  editingPlan,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-xl"
      height="h-auto"
      className="rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
      padding="p-6 sm:p-7"
    >
      <div className="space-y-6">
        {/* Cabecera del Modal */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            {editingPlan ? <Edit size={20} /> : <Layers size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              {editingPlan ? `Editar Plan '${editingPlan.plan_name}'` : 'Nuevo Plan de Suscripción'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editingPlan
                ? 'Modifica los parámetros tarifarios, límites de consumo de IA y periodicidad del plan.'
                : 'Configura un nuevo nivel de servicio SaaS con límites de tokens y esquema de cobro.'}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <SubscriptionPlanForm
          initialData={editingPlan}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      </div>
    </Modal>
  );
};
