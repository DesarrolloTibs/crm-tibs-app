import React from 'react';
import {
  Settings2,
  Building2,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import Modal from '@shared/components/Modal';
import Button from '@shared/components/Button';
import { TenantGeneralTab } from './TenantGeneralTab';
import { TenantPlanTab } from './TenantPlanTab';
import { TenantRenewalQueueTab } from './TenantRenewalQueueTab';
import type {
  TenantPlanInfo,
  Plan,
  TenantGeneralFormData,
  RenewalQueueResponse,
  RenewalQueueItem,
} from '../schemas/tenants.schema';

interface TenantManageModalProps {
  open: boolean;
  tenant: TenantPlanInfo | null;
  activeTab: 'general' | 'plan' | 'queue';
  setActiveTab: (tab: 'general' | 'plan' | 'queue') => void;
  onClose: () => void;
  plans: Plan[];
  onUpdateGeneral: (data: TenantGeneralFormData) => Promise<void>;
  onAssignPlan: (data: {
    planId: number;
    changeType: 'immediate' | 'next_period';
    immediatePolicy?: 'reset_date' | 'keep_current_date';
    months: number;
    updateQueuedPlans?: boolean;
    allowExtra?: boolean;
  }) => Promise<void>;
  onEnqueueRenewal: (data: { planId: number; periodsCount: number }) => Promise<void>;
  onRemoveQueueItem: (item: RenewalQueueItem) => void;
  onRefreshQueue: () => void;
  queueData: RenewalQueueResponse | null;
  queueLoading: boolean;
  queueSubmitting: boolean;
  submitting: boolean;
}

export const TenantManageModal: React.FC<TenantManageModalProps> = ({
  open,
  tenant,
  activeTab,
  setActiveTab,
  onClose,
  plans,
  onUpdateGeneral,
  onAssignPlan,
  onEnqueueRenewal,
  onRemoveQueueItem,
  onRefreshQueue,
  queueData,
  queueLoading,
  queueSubmitting,
  submitting,
}) => {
  if (!tenant) return null;

  const totalQueued = queueData?.total_queued_periods || 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-2xl"
      height="max-h-[90vh]"
      padding="p-0"
      className="rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
      hideCloseButton={true}
    >
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Cabecera del modal */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Settings2 size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {tenant.name}
              </h3>
              <div className="text-xs font-mono text-indigo-600">
                Esquema: {tenant.schema_name}
              </div>
            </div>
          </div>

          <Button
            variant="icon"
            onClick={onClose}
            className="!text-slate-400 hover:!text-slate-600 !p-1.5 hover:!bg-slate-100"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Pestañas de navegación */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <Button
            variant="ghost"
            type="button"
            onClick={() => setActiveTab('general')}
            className={`!py-3 !px-4 !text-xs !font-bold flex items-center gap-2 border-b-2 !rounded-none transition-all ${
              activeTab === 'general'
                ? '!border-indigo-600 !text-indigo-600 !bg-white'
                : '!border-transparent !text-slate-500 hover:!text-slate-700'
            }`}
          >
            <Building2 size={15} />
            <span>General</span>
          </Button>

          <Button
            variant="ghost"
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`!py-3 !px-4 !text-xs !font-bold flex items-center gap-2 border-b-2 !rounded-none transition-all ${
              activeTab === 'plan'
                ? '!border-indigo-600 !text-indigo-600 !bg-white'
                : '!border-transparent !text-slate-500 hover:!text-slate-700'
            }`}
          >
            <Sparkles size={15} />
            <span>Plan & Suscripción</span>
          </Button>

          <Button
            variant="ghost"
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`!py-3 !px-4 !text-xs !font-bold flex items-center gap-2 border-b-2 !rounded-none transition-all ${
              activeTab === 'queue'
                ? '!border-indigo-600 !text-indigo-600 !bg-white'
                : '!border-transparent !text-slate-500 hover:!text-slate-700'
            }`}
          >
            <Layers size={15} />
            <span>Cola de Renovación</span>
            {totalQueued > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {totalQueued}
              </span>
            )}
          </Button>
        </div>

        {/* Contenido según pestaña activa */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'general' && (
            <TenantGeneralTab
              tenant={tenant}
              onSubmit={onUpdateGeneral}
              onClose={onClose}
              submitting={submitting}
            />
          )}

          {activeTab === 'plan' && (
            <TenantPlanTab
              tenant={tenant}
              plans={plans}
              onSubmit={onAssignPlan}
              onClose={onClose}
              submitting={submitting}
            />
          )}

          {activeTab === 'queue' && (
            <TenantRenewalQueueTab
              tenant={tenant}
              plans={plans}
              queueData={queueData}
              queueLoading={queueLoading}
              queueSubmitting={queueSubmitting}
              onRefreshQueue={onRefreshQueue}
              onRemoveQueueItem={onRemoveQueueItem}
              onEnqueueSubmit={onEnqueueRenewal}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};
