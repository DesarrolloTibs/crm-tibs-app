import React from 'react';
import { Settings2 } from 'lucide-react';
import Modal from '@shared/components/Modal';
import Drawer from '@shared/components/Drawer';
import ConfirmModal from '@shared/components/ConfirmModal';
import Input from '@shared/components/Input';
import Select from '@shared/components/Select';
import Button from '@shared/components/Button';
import Tabs from '@shared/components/Tabs';
import OpportunityForm from './OpportunityForm';
import PipelineStagesSettings from './PipelineStagesSettings';
import InteractionsTab from './InteractionsTab';
import FilesTab from './FilesTab';
import { ActivitiesTab } from '@features/activities';
import type { Stage, Opportunity } from '@core/models/Opportunity';

interface Props {
  // Form modal (create / edit)
  isFormModalOpen: boolean;
  setIsFormModalOpen: (v: boolean) => void;
  editingOpportunity: Opportunity | null;
  setEditingOpportunity: (o: Opportunity | null) => void;
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  onCreateOpportunity: (p: Partial<Opportunity>) => void;
  onUpdateOpportunity: (p: Partial<Opportunity>) => void;

  // Delete confirm modal
  isConfirmModalOpen: boolean;
  setIsConfirmModalOpen: (v: boolean) => void;
  opportunityToDelete: Opportunity | null;
  onConfirmDelete: () => void;

  // Edit stage modal
  editingStage: Stage | null;
  setEditingStage: (s: Stage | null) => void;
  editStageErrors?: Partial<Record<'strname' | 'intmaxdays', string>>;
  onSaveStage: (e: React.FormEvent) => void;

  // Settings drawer
  showStagesConfig: boolean;
  setShowStagesConfig: (v: boolean) => void;
  isAdmin: boolean;
  fetchPipelineAndOpportunities: () => void;
}

const PipelineModals: React.FC<Props> = ({
  isFormModalOpen,
  setIsFormModalOpen,
  editingOpportunity,
  setEditingOpportunity,
  setOpportunities,
  onCreateOpportunity,
  onUpdateOpportunity,
  isConfirmModalOpen,
  setIsConfirmModalOpen,
  opportunityToDelete,
  onConfirmDelete,
  editingStage,
  setEditingStage,
  editStageErrors,
  onSaveStage,
  showStagesConfig,
  setShowStagesConfig,
  isAdmin,
  fetchPipelineAndOpportunities,
}) => {
  const getModalContent = () => {
    if (!editingOpportunity?.id)
      return (
        <OpportunityForm
          initialData={editingOpportunity || undefined}
          onSubmit={onCreateOpportunity}
          onCancel={() => setIsFormModalOpen(false)}
        />
      );
    const tabs = [
      {
        label: 'Datos',
        content: (
          <OpportunityForm
            initialData={editingOpportunity}
            onSubmit={onUpdateOpportunity}
            onCancel={() => setIsFormModalOpen(false)}
          />
        ),
      },
      {
        label: 'Actividades',
        content: (
          <ActivitiesTab opportunityId={editingOpportunity.id} opportunity={editingOpportunity} />
        ),
      },
      { label: 'Historial', content: <InteractionsTab opportunityId={editingOpportunity.id} /> },
      {
        label: 'Archivos',
        content: (
          <FilesTab
            opportunity={editingOpportunity}
            onUploadSuccess={updatedOpp => {
              setEditingOpportunity(updatedOpp);
              setOpportunities(prev => prev.map(o => (o.id === updatedOpp.id ? updatedOpp : o)));
            }}
          />
        ),
      },
    ];
    return <Tabs tabs={tabs} />;
  };

  return (
    <>
      {/* Settings Drawer */}
      <Drawer
        open={showStagesConfig}
        onClose={() => setShowStagesConfig(false)}
        title="Configurar Pipeline"
        icon={<Settings2 size={20} className="text-indigo-600" />}
      >
        {isAdmin ? (
          <PipelineStagesSettings
            onlyPipelineDetails={false}
            onSaveSuccess={() => fetchPipelineAndOpportunities()}
          />
        ) : (
          <div className="text-center py-10 text-red-500 font-semibold">
            No tienes permisos para configurar el pipeline.
          </div>
        )}
      </Drawer>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={onConfirmDelete}
        message={`¿Seguro que deseas eliminar la oportunidad "${opportunityToDelete?.nombre_proyecto}"?`}
      />

      {/* Opportunity Form Modal */}
      <Modal open={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} maxWidth="max-w-5xl">
        {getModalContent()}
      </Modal>

      {/* Edit Stage Modal */}
      <Modal
        open={editingStage !== null}
        onClose={() => setEditingStage(null)}
        maxWidth="max-w-md"
        height="h-auto"
      >
        {editingStage && (
          <form noValidate onSubmit={onSaveStage} className="space-y-6 p-2">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Settings2 size={18} className="text-indigo-600" /> Editar Etapa:{' '}
              {editingStage.strname || 'Nueva'}
            </h3>
            <div className="space-y-4">
              <Input
                label="Nombre de la Etapa"
                type="text"
                value={editingStage.strname}
                onChange={e => setEditingStage({ ...editingStage, strname: e.target.value })}
                error={editStageErrors?.strname}
                placeholder="Ej. Propuesta"
                required
              />
              <Input
                label="Límite de Días"
                type="number"
                min="0"
                value={
                  editingStage.intmaxdays !== undefined && editingStage.intmaxdays !== null
                    ? editingStage.intmaxdays
                    : ''
                }
                onChange={e => {
                  const v = e.target.value;
                  setEditingStage({
                    ...editingStage,
                    intmaxdays: v === '' ? null : Number(v),
                  });
                }}
                error={editStageErrors?.intmaxdays}
                placeholder="Ej. 15 (dejar vacío para sin límite)"
              />
              <Select
                label="Tipo de Cierre / Etapa"
                size="sm"
                menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                value={[
                  { value: 0, label: 'Abierta / En Proceso (Default)' },
                  { value: 1, label: '✓ Ganada / Cierre Exitoso' },
                  { value: 2, label: '✕ Perdida / Cierre Perdido' },
                ].find((opt) => opt.value === Number(editingStage.stage_type ?? 0))}
                onChange={(selected: any) =>
                  setEditingStage({ ...editingStage, stage_type: Number(selected?.value ?? 0) })
                }
                options={[
                  { value: 0, label: 'Abierta / En Proceso (Default)' },
                  { value: 1, label: '✓ Ganada / Cierre Exitoso' },
                  { value: 2, label: '✕ Perdida / Cierre Perdido' },
                ]}
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button type="button" onClick={() => setEditingStage(null)} variant="secondary">
                Cancelar
              </Button>
              <Button type="submit" variant="indigo">
                Guardar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default PipelineModals;
