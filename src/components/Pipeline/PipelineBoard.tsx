import React, { useEffect, useState, useMemo } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import Confetti from 'react-confetti-boom';
import type { Opportunity, OpportunityStageType } from '../../core/models/Opportunity';
import { OpportunityStage, BusinessLine } from '../../core/models/Opportunity';
import { getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity, archiveOpportunity } from '../../services/opportunitiesService';
import Loader from '../Loader/Loader';
import PipelineColumn from './PipelineColumn';
import Modal from '../Modal/Modal';
import ConfirmModal from '../Modal/ConfirmModal';

import OpportunityCard from './OpportunityCard';
import { Plus, Search, User, Tag, XCircle, Filter, Columns, CheckSquare, Square } from 'lucide-react';
import OpportunityForm from './OpportunityForm';
import Tabs from '../Tabs/Tabs';
import RemindersTab from '../Reminder/RemindersTab';
import InteractionsTab from '../Interaction/InteractionsTab';

import { useAuth } from '../../hooks/useAuth';
import ProposalTab from '../Proposal/ProposalTab';
import Notification from '../Modal/Notification';



const STAGES: OpportunityStageType[] = [
  OpportunityStage.NUEVO,
  OpportunityStage.DESCUBRIMIENTO,
  OpportunityStage.ESTIMACION,
  OpportunityStage.PROPUESTA,
  OpportunityStage.NEGOCIACION,
    OpportunityStage.GANADA,
     OpportunityStage.PERDIDA,
    OpportunityStage.CANCELADA,
];

const PipelinePage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [executiveFilter, setExecutiveFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [visibleStages, setVisibleStages] = useState<OpportunityStageType[]>(STAGES);
  const [isExploding, setIsExploding] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = () => setNotification({ ...notification, show: false });


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
        setNotification({
          show: true,
          type: 'error',
          title: 'Error',
          message: 'No se pudieron cargar las oportunidades',
          onConfirm: hideNotification,
          onCancel: hideNotification,      });
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
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: 'Oportunidad creada correctamente',
        onConfirm: hideNotification,
        onCancel: hideNotification,      });
      fetchOpportunities();
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear la oportunidad',
        onConfirm: hideNotification,
        onCancel: hideNotification,      });
    }
  };

  const handleUpdate = async (opportunity: Partial<Opportunity>) => {
    if (!opportunity.id) return;
    try {
      // Desestructuramos para quitar los campos que no se deben enviar en el update.
      const { id, cliente, proposalDocumentPath,ejecutivo,archived, ...updateData } = opportunity as any;
      console.log("Updating opportunity:", id, updateData);
      await updateOpportunity(id, updateData);
      setEditingOpportunity(null);
      setIsFormModalOpen(false);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: 'Oportunidad actualizada correctamente',
        onConfirm: hideNotification,
        onCancel: hideNotification,      });
      fetchOpportunities();
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar la oportunidad',
        onConfirm: hideNotification,
        onCancel: hideNotification,      });
    }
  };

  const handleDelete = async () => {
    if (!opportunityToDelete) return;
    try {
      await deleteOpportunity(opportunityToDelete.id);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Eliminada!',
        message: 'Oportunidad eliminada correctamente',
        onConfirm: hideNotification,
        onCancel: hideNotification,      });
      fetchOpportunities();
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar la oportunidad',
        onConfirm: hideNotification,
        onCancel: hideNotification,      });
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

  const handleArchive = async (opportunity: Opportunity) => {
    const isArchiving = !opportunity.archived;
    setNotification({
      show: true,
      type: 'confirmation',
      title: `¿Seguro que deseas ${isArchiving ? 'archivar' : 'desarchivar'} la oportunidad?`,
      message: isArchiving ? 'La oportunidad se ocultará de la vista principal.' : 'La oportunidad volverá a estar visible.',
      onConfirm: async () => {
        hideNotification();
        // Actualización optimista del estado
        const originalOpportunities = [...opportunities];
        const updatedOpportunities = opportunities.map(opp =>
          opp.id === opportunity.id ? { ...opp, archived: isArchiving } : opp
        );
        setOpportunities(updatedOpportunities);

        try {
          await archiveOpportunity(opportunity.id, isArchiving);
          setNotification({
            show: true, type: 'success', title: '¡Éxito!', message: `Oportunidad ${isArchiving ? 'archivada' : 'desarchivada'} correctamente.`, onConfirm: hideNotification, onCancel: hideNotification
          });
        } catch (error) {
          setNotification({
            show: true, type: 'error', title: 'Error', message: `No se pudo ${isArchiving ? 'archivar' : 'desarchivar'} la oportunidad.`, onConfirm: hideNotification, onCancel: hideNotification
          });
          // Revertir en caso de error
          setOpportunities(originalOpportunities);
        }
      },
      onCancel: hideNotification,
    });
  };

  const findStageForOpportunity = (id: string) => {
    return opportunities.find(o => o.id === id)?.etapa;
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const opportunity = opportunities.find(o => o.id === active.id);
    if (opportunity) {
      setActiveOpportunity(opportunity);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpportunity(null); // Limpiamos la tarjeta activa al soltar

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

      if (overStage === OpportunityStage.GANADA) {
        setIsExploding(true);
        setTimeout(() => setIsExploding(false), 4000); // El confeti se detiene después de 4 segundos
      }

      const opportunityToUpdate = updatedOpportunities.find(o => o.id === activeId);

      if (opportunityToUpdate) {
        // Desestructuramos para quitar los campos que no se deben enviar en el update.
        const { id, cliente, proposalDocumentPath,ejecutivo,archived,tipoCambio, ...rest } = opportunityToUpdate as any;
        const updateData = {
          ...rest,
          monto_licenciamiento: Number(rest.monto_licenciamiento) || 0,
          monto_servicios: Number(rest.monto_servicios) || 0,
             monto_total: Number(rest.monto_total) || 0,
        };

        console.log("Updating opportunity:", id, updateData);
        updateOpportunity(id, updateData).catch(() => {
          setNotification({
            show: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo mover la oportunidad',
            onConfirm: hideNotification,
            onCancel: hideNotification,          });
          // Revertimos al estado original si falla la actualización
          setOpportunities(originalOpportunities);
        });
      }
    }
  };

  const executives = useMemo(() => {
    const execs = new Map<string, { id: string; username: string }>();
    opportunities.forEach(opp => {
      if (opp.ejecutivo && opp.ejecutivo.id && !execs.has(opp.ejecutivo.id)) {
        execs.set(opp.ejecutivo.id, { id: opp.ejecutivo.id, username: opp.ejecutivo.username });
      }
    });
    return Array.from(execs.values());
  }, [opportunities]);

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecutive = executiveFilter ? opp.ejecutivo_id === executiveFilter : true;
    const matchesStatus = statusFilter ? opp.etapa === statusFilter : true;
    const matchesArchived = opp.archived === false || opp.archived === undefined;
    return matchesSearch && matchesExecutive && matchesStatus && matchesArchived;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setExecutiveFilter('');
    setStatusFilter('');
  };

  const handleStageVisibilityChange = (stage: OpportunityStageType) => {
    setVisibleStages(prev => {
      const isCurrentlyVisible = prev.includes(stage);
      // Prevenir que se desactive una etapa si solo quedan 3 visibles
      if (isCurrentlyVisible && prev.length <= 3) {
        setNotification({
          show: true,
          type: 'warning',
          title: 'Acción no permitida',
          message: 'Debes mantener al menos 3 etapas visibles.',
          onConfirm: hideNotification,
          onCancel: hideNotification,        });
        return prev; // No se aplica el cambio
      }

      return isCurrentlyVisible
        ? prev.filter(s => s !== stage) // Ocultar etapa
        : [...prev, stage]; // Mostrar etapa
    });
  };

  useEffect(() => {
    // Reset filters if needed, or handle side effects
  }, [searchTerm, executiveFilter, statusFilter]);

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
      { label: 'Datos', content: <OpportunityForm initialData={editingOpportunity} onSubmit={handleUpdate} onCancel={() => setIsFormModalOpen(false)} /> },
    
      { label: 'Historial', content: <InteractionsTab opportunityId={editingOpportunity.id} /> },
      { label: 'Recordatorios', content: <RemindersTab opportunityId={editingOpportunity.id} /> },
        { label: 'Propuesta', content: <ProposalTab opportunity={editingOpportunity} onUploadSuccess={(updatedOpp) => {
          // Actualizamos el estado local para reflejar el cambio en la UI sin recargar todo
          setEditingOpportunity(updatedOpp);
          setOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o));
        }} /> 
      },
      
    ];
    return <Tabs tabs={tabs} />;
  };

  if (loading) {
    return (
        <Loader />
    );
  }

  return (
    <>
        {isExploding && (          
          <div className="fixed top-0 left-0 w-full h-full z-[100] pointer-events-none">
            <Confetti
           
              deg={270} // Dirección hacia arriba
              mode="boom"
              particleCount={150} // Más partículas para una celebración mayor
              spreadDeg={45} // Un cono de explosión más cerrado
              launchSpeed={3} // Partículas viajan un poco más lejos y rápido
              effectCount={1} // Una sola gran explosión
              shapeSize={10} // Tamaño de las partículas
              // Colores alineados con la paleta de la aplicación
              colors={['#22c55e', '#3b82f6', '#8b5cf6', '#a855f7', '#ffffff']}
            />
          </div>
        )}
        <Notification {...notification} />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pipeline de Oportunidades</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors"
                onClick={() => setShowStageSelector(!showStageSelector)}
              >
                <Columns size={16} />
                <span>Etapas</span>
              </button>
              {showStageSelector && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
                  <h4 className="font-semibold text-sm mb-2">Mostrar/Ocultar Etapas</h4>
                  <div className="space-y-2">
                    {STAGES.map(stage => {
                      const isChecked = visibleStages.includes(stage);
                      const isDisabled = isChecked && visibleStages.length <= 3;
                      return (
                        <label key={stage} className={`flex items-center space-x-2 text-sm ${isDisabled ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => handleStageVisibilityChange(stage)}
                            className="hidden"
                          />
                          {isChecked ? <CheckSquare size={16} className={isDisabled ? 'text-gray-400' : 'text-blue-600'} /> : <Square size={16} className="text-gray-400" />}
                          <span>{stage}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <button
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} />
                <span>Filtros</span>
              </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              onClick={openCreateModal}
            >
              <Plus size={18} /> Nueva Oportunidad
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 animate-fade-in-down">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Filtros</h3>
              <button onClick={handleClearFilters} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                <XCircle size={16} className="mr-1" />
                Limpiar filtros
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <Search size={20} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por proyecto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <User size={20} />
                </span>
                <select
                  value={executiveFilter}
                  onChange={e => setExecutiveFilter(e.target.value)}
                  className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                >
                  <option value="">Todos los Ejecutivos</option>
                  {executives.map(exec => (
                    <option key={exec.id} value={exec.id}>{exec.username}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <Tag size={20} />
                </span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                >
                  <option value="">Todos los Estatus</option>
                  {STAGES.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {STAGES.filter(stage => visibleStages.includes(stage)).map(stage => (
              <PipelineColumn key={stage}
                stage={stage}
                opportunities={filteredOpportunities.filter(opp => opp.etapa === stage)}
                onEdit={openEditModal}
                onDelete={openDeleteConfirm}
                onArchive={handleArchive}
                isAdmin={isAdmin}
              />
            ))}
          </div>
          <DragOverlay>
            {activeOpportunity ? (
              <OpportunityCard
                opportunity={activeOpportunity}
                onEdit={() => {}} // No-op durante el drag
                onDelete={() => {}} // No-op durante el drag
                onArchive={() => {}} // No-op durante el drag
                isAdmin={isAdmin}
              />
            ) : null}
          </DragOverlay>
      </DndContext>
      <ConfirmModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        message={`¿Seguro que deseas eliminar la oportunidad "${opportunityToDelete?.nombre_proyecto}"?`}
      />
      {/* Hacemos el modal más grande cuando se está editando para acomodar las pestañas */}
      <Modal open={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
        {getModalContent()}
      </Modal>
    </>
      );
};

export default PipelinePage;
