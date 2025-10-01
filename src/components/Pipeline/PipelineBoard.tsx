import React, { useEffect, useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext } from '@dnd-kit/core';
import type { Opportunity, OpportunityStageType } from '../../core/models/Opportunity';
import { OpportunityStage } from '../../core/models/Opportunity';
import { getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity } from '../../services/opportunitiesService';
import Swal from 'sweetalert2';
import Loader from '../Loader/Loader';
import PipelineColumn from './PipelineColumn';
import Sidebar from '../Sidebar/Sidebar';
import Modal from '../Modal/Modal';
import ConfirmModal from '../Modal/ConfirmModal';

import { Plus } from 'lucide-react';
import OpportunityForm from './OpportunityForm';
import Tabs from '../Tabs/Tabs';
import RemindersTab from '../Reminder/RemindersTab';
import InteractionsTab from '../Interaction/InteractionsTab';



const STAGES: OpportunityStageType[] = [
  OpportunityStage.NUEVO,
  OpportunityStage.CANCELADA,
  OpportunityStage.DESCUBRIMIENTO,
  OpportunityStage.ESTIMACION,
  OpportunityStage.PROPUESTA,
  OpportunityStage.NEGOCIACION,
];

const PipelinePage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const fetchOpportunities = async () => {
    setLoading(true);
      try {
        const data = await getOpportunities();
        if (Array.isArray(data)) {
          setOpportunities(data);
        } else {
          throw new Error('Data format is incorrect');
        }
      } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar las oportunidades', 'error');
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleCreate = async (opportunity: Partial<Opportunity>) => {
    try {

      console.log("Creating opportunity:", opportunity);
      await createOpportunity(opportunity);
      setIsFormModalOpen(false);
      Swal.fire('¡Éxito!', 'Oportunidad creada correctamente', 'success');
      fetchOpportunities();
    } catch (error) {
      Swal.fire('Error', 'No se pudo crear la oportunidad', 'error');
    }
  };

  const handleUpdate = async (opportunity: Partial<Opportunity>) => {
    if (!opportunity.id) return;
    try {
      // Desestructuramos para quitar los campos que no se deben enviar en el update.
      const { id, cliente, proposalDocumentPath, ...updateData } = opportunity as any;
      console.log("Updating opportunity:", id, updateData);
      await updateOpportunity(id, updateData);
      setEditingOpportunity(null);
      setIsFormModalOpen(false);
      Swal.fire('¡Éxito!', 'Oportunidad actualizada correctamente', 'success');
      fetchOpportunities();
    } catch (error) {
      Swal.fire('Error', 'No se pudo actualizar la oportunidad', 'error');
    }
  };

  const handleDelete = async () => {
    if (!opportunityToDelete) return;
    try {
      await deleteOpportunity(opportunityToDelete.id);
      Swal.fire('¡Eliminada!', 'Oportunidad eliminada correctamente', 'success');
      fetchOpportunities();
    } catch (error) {
      Swal.fire('Error', 'No se pudo eliminar la oportunidad', 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setOpportunityToDelete(null);
    }
  };

  const openCreateModal = () => {
    setEditingOpportunity(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setIsFormModalOpen(true);
  };

  const openDeleteConfirm = (opportunity: Opportunity) => {
    setOpportunityToDelete(opportunity);
    setIsConfirmModalOpen(true);
  };

  const findStageForOpportunity = (id: string) => {
    return opportunities.find(o => o.id === id)?.etapa;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeStage = findStageForOpportunity(activeId);
    let overStage = STAGES.find(s => s === overId);
    if (!overStage) {
        overStage = findStageForOpportunity(overId);
    }

    if (activeStage && overStage && activeStage !== overStage) {
      const originalOpportunities = [...opportunities];
      const updatedOpportunities = opportunities.map(o =>
        o.id === activeId ? { ...o, etapa: overStage! } : o
      );
      setOpportunities(updatedOpportunities);

      const opportunityToUpdate = updatedOpportunities.find(o => o.id === activeId);

      if (opportunityToUpdate) {
        // Desestructuramos para quitar los campos que no se deben enviar en el update.
        const { id, cliente, proposalDocumentPath, ...rest } = opportunityToUpdate as any;
        const updateData = {
          ...rest,
          monto_licenciamiento: Number(rest.monto_licenciamiento) || 0,
          monto_servicios: Number(rest.monto_servicios) || 0,
             monto_total: Number(rest.monto_total) || 0,
        };

        console.log("Updating opportunity:", id, updateData);
        updateOpportunity(id, updateData).catch(() => {
          Swal.fire('Error', 'No se pudo mover la oportunidad', 'error');
          // Revertimos al estado original si falla la actualización
          setOpportunities(originalOpportunities);
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="p-8 flex-1"><Loader /></div>
      </div>
    );
  }

  const getModalContent = () => {
    // Si estamos creando, solo mostramos el formulario
    if (!editingOpportunity) {
      return (
        <OpportunityForm
          initialData={undefined}
          onSubmit={handleCreate}
          onCancel={() => setIsFormModalOpen(false)}
        />
      );
    }

    // Si estamos editando, mostramos las pestañas
    const tabs = [
      { label: 'Datos de Oportunidad', content: <OpportunityForm initialData={editingOpportunity} onSubmit={handleUpdate} onCancel={() => setIsFormModalOpen(false)} /> },
      { label: 'Recordatorios', content: <RemindersTab opportunityId={editingOpportunity.id} /> },
      { label: 'Interacciones', content: <InteractionsTab opportunityId={editingOpportunity.id} /> },
    ];
    return <Tabs tabs={tabs} />;
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="p-8 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pipeline de Oportunidades</h1>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            onClick={openCreateModal}
          >
            <Plus size={18} /> Nueva Oportunidad
          </button>
        </div>
        <DndContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 p-4 overflow-x-auto">
            {STAGES.map(stage => (
              <PipelineColumn key={stage}
                stage={stage}
                opportunities={opportunities.filter(opp => opp.etapa === stage)}
                onEdit={openEditModal}
                onDelete={openDeleteConfirm}
              />
            ))}
          </div>
        </DndContext>
      </div>
      <ConfirmModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        message={`¿Seguro que deseas eliminar la oportunidad "${opportunityToDelete?.nombre_proyecto}"?`}
      />
      <Modal open={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
        {getModalContent()}
      </Modal>
    </div>
  );
};

export default PipelinePage;
