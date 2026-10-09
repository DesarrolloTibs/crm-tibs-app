import React, { useState, useEffect } from 'react';
import { Settings2, X } from 'lucide-react';
import Modal from '../../../../components/shared/Modal';
import ConfirmModal from '../../../../components/shared/ConfirmModal';
import Input from '../../../../components/shared/Input';
import Select from '../../../../components/shared/Select';
import Button from '../../../../components/shared/Button';
import Tabs from '../../../../components/shared/Tabs';
import OpportunityForm from './OpportunityForm';
import PipelineStagesSettingsDrawer from './PipelineStagesSettingsDrawer';
import OpportunityInteractionsTab from './OpportunityInteractionsTab';
import OpportunityFilesTab from './OpportunityFilesTab';
import { ActivitiesTab } from '../../../Activities';
import type { Stage, Opportunity, OpportunityCatalogOption } from '../../schemas/pipeline.schema';
import type { OpportunityCatalogs } from '../../hooks/usePipeline';

interface Props {
  // Modal de formulario (crear / editar)
  isFormModalOpen: boolean;
  setIsFormModalOpen: (v: boolean) => void;
  editingOpportunity: Opportunity | null;
  setEditingOpportunity: (o: Opportunity | null) => void;
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  onCreateOpportunity: (p: Partial<Opportunity>) => void;
  onUpdateOpportunity: (p: Partial<Opportunity>) => void;

  // Catálogos compartidos y etapas
  stages: Stage[];
  opportunityCatalogs: OpportunityCatalogs;
  catalogsLoading: boolean;
  businessLines: OpportunityCatalogOption[];

  // Modal de confirmación de eliminación
  isConfirmModalOpen: boolean;
  setIsConfirmModalOpen: (v: boolean) => void;
  opportunityToDelete: Opportunity | null;
  onConfirmDelete: () => void;

  // Modal de edición de etapa rápida
  editingStage: Stage | null;
  setEditingStage: (s: Stage | null) => void;
  onSaveStage: (e: React.FormEvent) => void;

  // Drawer lateral de configuración
  showStagesConfig: boolean;
  setShowStagesConfig: (v: boolean) => void;
  isAdmin: boolean;
  fetchPipelineAndOpportunities: () => void;
}

export const PipelineModalsManager: React.FC<Props> = ({
  isFormModalOpen,
  setIsFormModalOpen,
  editingOpportunity,
  setEditingOpportunity,
  setOpportunities,
  onCreateOpportunity,
  onUpdateOpportunity,
  stages,
  opportunityCatalogs,
  catalogsLoading,
  businessLines,
  isConfirmModalOpen,
  setIsConfirmModalOpen,
  opportunityToDelete,
  onConfirmDelete,
  editingStage,
  setEditingStage,
  onSaveStage,
  showStagesConfig,
  setShowStagesConfig,
  isAdmin,
  fetchPipelineAndOpportunities,
}) => {
  const [activeModalTab, setActiveModalTab] = useState<number>(0);

  // Reiniciar a la pestaña 'Datos' (0) cuando se abre o cierra el modal
  useEffect(() => {
    if (!isFormModalOpen) {
      setActiveModalTab(0);
    }
  }, [isFormModalOpen, editingOpportunity?.id]);

  const getModalContent = () => {
    if (!editingOpportunity?.id) {
      return (
        <OpportunityForm
          key="create-opportunity"
          initialData={editingOpportunity || undefined}
          onSubmit={onCreateOpportunity}
          onCancel={() => setIsFormModalOpen(false)}
          stages={stages}
          clients={opportunityCatalogs.clients}
          companies={opportunityCatalogs.companies}
          products={opportunityCatalogs.products}
          opportunityLabels={opportunityCatalogs.opportunityLabels}
          businessLines={businessLines}
          deliveryTypes={opportunityCatalogs.deliveryTypes}
          licensings={opportunityCatalogs.licensings}
          executives={opportunityCatalogs.executives}
          loadingCatalogs={catalogsLoading}
        />
      );
    }

    const tabs = [
      {
        label: 'Datos',
        content: (
          <OpportunityForm
            key={editingOpportunity.id}
            initialData={editingOpportunity}
            onSubmit={onUpdateOpportunity}
            onCancel={() => setIsFormModalOpen(false)}
            stages={stages}
            clients={opportunityCatalogs.clients}
            companies={opportunityCatalogs.companies}
            products={opportunityCatalogs.products}
            opportunityLabels={opportunityCatalogs.opportunityLabels}
            businessLines={businessLines}
            deliveryTypes={opportunityCatalogs.deliveryTypes}
            licensings={opportunityCatalogs.licensings}
            executives={opportunityCatalogs.executives}
            loadingCatalogs={catalogsLoading}
          />
        ),
      },
      {
        label: 'Actividades',
        content:
          activeModalTab === 1 ? (
            <ActivitiesTab
              opportunityId={editingOpportunity.id}
              opportunity={editingOpportunity}
            />
          ) : null,
      },
      {
        label: 'Historial',
        content:
          activeModalTab === 2 ? (
            <OpportunityInteractionsTab opportunityId={editingOpportunity.id} />
          ) : null,
      },
      {
        label: 'Archivos',
        content:
          activeModalTab === 3 ? (
            <OpportunityFilesTab
              opportunity={editingOpportunity}
              onUploadSuccess={(updatedOpp) => {
                setEditingOpportunity(updatedOpp);
                setOpportunities((prev) =>
                  prev.map((o) => (o.id === updatedOpp.id ? updatedOpp : o))
                );
              }}
            />
          ) : null,
      },
    ];

    return (
      <Tabs
        tabs={tabs}
        activeIndex={activeModalTab}
        onTabChange={setActiveModalTab}
      />
    );
  };

  return (
    <>
      {/* Settings Drawer */}
      {showStagesConfig && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowStagesConfig(false)}
          />
          <div className="relative w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Settings2 size={20} className="text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-800">Configurar Pipeline</h2>
              </div>
              <Button
                variant="icon"
                onClick={() => setShowStagesConfig(false)}
                className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 !p-2"
                title="Cerrar configuración"
              >
                <X size={20} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {isAdmin ? (
                <PipelineStagesSettingsDrawer
                  onlyPipelineDetails={false}
                  onSaveSuccess={() => fetchPipelineAndOpportunities()}
                />
              ) : (
                <div className="text-center py-10 text-red-500 font-semibold">
                  No tienes permisos para configurar el pipeline.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={onConfirmDelete}
        message={`¿Seguro que deseas eliminar la oportunidad "${opportunityToDelete?.nombre_proyecto}"?`}
      />

      {/* Opportunity Form Modal */}
      <Modal
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        maxWidth="max-w-6xl"
      >
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
          <form onSubmit={onSaveStage} className="space-y-6 p-2">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Settings2 size={18} className="text-indigo-600" /> Editar Etapa:{' '}
              {editingStage.strname || 'Nueva'}
            </h3>
            <div className="space-y-4">
              <Input
                label="Nombre de la Etapa"
                type="text"
                value={editingStage.strname}
                onChange={(e) =>
                  setEditingStage({ ...editingStage, strname: e.target.value })
                }
                placeholder="Ej. Propuesta"
                required
              />
              <Input
                label="Límite de Días"
                type="number"
                min="0"
                value={
                  editingStage.intmaxdays !== undefined &&
                  editingStage.intmaxdays !== null
                    ? editingStage.intmaxdays
                    : ''
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setEditingStage({
                    ...editingStage,
                    intmaxdays: v === '' ? null : parseInt(v, 10),
                  });
                }}
                placeholder="Ej. 15 (dejar vacío para sin límite)"
              />
              <Select
                label="Tipo de Cierre / Etapa"
                options={[
                  { value: 0, label: 'Abierta / En Proceso (Default)' },
                  { value: 1, label: '✓ Ganada / Cierre Exitoso' },
                  { value: 2, label: '✕ Perdida / Cierre Perdido' },
                ]}
                value={{
                  value: Number(editingStage.stage_type ?? 0),
                  label:
                    Number(editingStage.stage_type ?? 0) === 1
                      ? '✓ Ganada / Cierre Exitoso'
                      : Number(editingStage.stage_type ?? 0) === 2
                      ? '✕ Perdida / Cierre Perdido'
                      : 'Abierta / En Proceso (Default)',
                }}
                onChange={(val: any) =>
                  setEditingStage({
                    ...editingStage,
                    stage_type: Number(val?.value ?? 0),
                  })
                }
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button
                type="button"
                onClick={() => setEditingStage(null)}
                variant="secondary"
              >
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

export const PipelineModals = PipelineModalsManager;
export default PipelineModalsManager;
