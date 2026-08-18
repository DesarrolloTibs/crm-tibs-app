import React from 'react';
import { Settings2, X } from 'lucide-react';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Tabs from '../shared/Tabs';
import OpportunityForm from './OpportunityForm';
import PipelineStagesSettings from './PipelineStagesSettings';
import InteractionsTab from '../Interaction/InteractionsTab';
import FilesTab from '../Files/FilesTab';
import ActivitiesTab from '../Activity/ActivitiesTab';
import type { Stage, Opportunity } from '../../core/models/Opportunity';

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
  onSaveStage: (e: React.FormEvent) => void;

  // Settings drawer
  showStagesConfig: boolean;
  setShowStagesConfig: (v: boolean) => void;
  isAdmin: boolean;
  fetchPipelineAndOpportunities: () => void;
}

const PipelineModals: React.FC<Props> = ({
  isFormModalOpen, setIsFormModalOpen, editingOpportunity, setEditingOpportunity,
  setOpportunities, onCreateOpportunity, onUpdateOpportunity,
  isConfirmModalOpen, setIsConfirmModalOpen, opportunityToDelete, onConfirmDelete,
  editingStage, setEditingStage, onSaveStage,
  showStagesConfig, setShowStagesConfig, isAdmin, fetchPipelineAndOpportunities,
}) => {
  const getModalContent = () => {
    if (!editingOpportunity?.id) return (
      <OpportunityForm initialData={editingOpportunity || undefined} onSubmit={onCreateOpportunity} onCancel={() => setIsFormModalOpen(false)} />
    );
    const tabs = [
      { label: 'Datos', content: <OpportunityForm initialData={editingOpportunity} onSubmit={onUpdateOpportunity} onCancel={() => setIsFormModalOpen(false)} /> },
      { label: 'Actividades', content: <ActivitiesTab opportunityId={editingOpportunity.id} opportunity={editingOpportunity} /> },
      { label: 'Historial', content: <InteractionsTab opportunityId={editingOpportunity.id} /> },
      { label: 'Archivos', content: <FilesTab opportunity={editingOpportunity} onUploadSuccess={updatedOpp => { setEditingOpportunity(updatedOpp); setOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o)); }} /> },
    ];
    return <Tabs tabs={tabs} />;
  };

  return (
    <>
      {/* Settings Drawer */}
      {showStagesConfig && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStagesConfig(false)} />
          <div className="relative w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2"><Settings2 size={20} className="text-indigo-600" /><h2 className="text-lg font-bold text-gray-800">Configurar Pipeline</h2></div>
              <button onClick={() => setShowStagesConfig(false)} className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {isAdmin ? (
                <PipelineStagesSettings onlyPipelineDetails={false} onSaveSuccess={() => fetchPipelineAndOpportunities()} />
              ) : (
                <div className="text-center py-10 text-red-500 font-semibold">No tienes permisos para configurar el pipeline.</div>
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
      <Modal open={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} maxWidth="max-w-6xl">
        {getModalContent()}
      </Modal>

      {/* Edit Stage Modal */}
      <Modal open={editingStage !== null} onClose={() => setEditingStage(null)} maxWidth="max-w-md" height="h-auto">
        {editingStage && (
          <form onSubmit={onSaveStage} className="space-y-6 p-2">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Settings2 size={18} className="text-indigo-600" /> Editar Etapa: {editingStage.strname || 'Nueva'}
            </h3>
            <div className="space-y-4">
              <Input label="Nombre de la Etapa" type="text" value={editingStage.strname} onChange={e => setEditingStage({ ...editingStage, strname: e.target.value })} placeholder="Ej. Propuesta" required />
              <Input label="Límite de Días" type="number" min="0"
                value={editingStage.intmaxdays !== undefined && editingStage.intmaxdays !== null ? editingStage.intmaxdays : ''}
                onChange={e => { const v = e.target.value; setEditingStage({ ...editingStage, intmaxdays: v === '' ? null : parseInt(v, 10) }); }}
                placeholder="Ej. 15 (dejar vacío para sin límite)"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Tipo de Cierre / Etapa</label>
                <select
                  value={Number(editingStage.stage_type ?? 0)}
                  onChange={e => setEditingStage({ ...editingStage, stage_type: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value={0}>Abierta / En Proceso (Default)</option>
                  <option value={1}>✓ Ganada / Cierre Exitoso</option>
                  <option value={2}>✕ Perdida / Cierre Perdido</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button type="button" onClick={() => setEditingStage(null)} variant="secondary">Cancelar</Button>
              <Button type="submit" variant="indigo">Guardar</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default PipelineModals;
