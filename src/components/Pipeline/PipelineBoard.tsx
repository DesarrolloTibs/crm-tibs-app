import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import Confetti from 'react-confetti-boom';
import type { Opportunity, Stage } from '../../core/models/Opportunity';
import { getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity, archiveOpportunity } from '../../services/opportunitiesService';
import { getMainPipeline, updateMainPipeline } from '../../services/pipelinesService';
import Loader from '../Loader/Loader';
import PipelineColumn from './PipelineColumn';
import Modal from '../Modal/Modal';
import ConfirmModal from '../Modal/ConfirmModal';

import OpportunityCard from './OpportunityCard';
import { Plus, Search, User, Tag, XCircle, Filter, Columns, CheckSquare, Square, ChevronUp, ChevronDown, Settings2, X } from 'lucide-react';
import PipelineStagesSettings from './PipelineStagesSettings';
import OpportunityForm from './OpportunityForm';
import Tabs from '../Tabs/Tabs';
import RemindersTab from '../Reminder/RemindersTab';
import InteractionsTab from '../Interaction/InteractionsTab';
import ProposalTab from '../Proposal/ProposalTab';
import Notification from '../Modal/Notification';
import ActivitiesTab from '../Activity/ActivitiesTab';

const PipelinePage: React.FC = () => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const [stages, setStages] = useState<Stage[]>([]);
  const [visibleStageIds, setVisibleStageIds] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [foldedStageIds, setFoldedStageIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pipeline_folded_stages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('pipeline_folded_stages', JSON.stringify(foldedStageIds));
  }, [foldedStageIds]);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [executiveFilter, setExecutiveFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showStagesConfig, setShowStagesConfig] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const stageSelectorRef = useRef<HTMLDivElement>(null);

  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const addStageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingStage && addStageInputRef.current) {
      addStageInputRef.current.focus();
    }
  }, [isAddingStage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stageSelectorRef.current && !stageSelectorRef.current.contains(event.target as Node)) {
        setShowStageSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = () => setNotification({ ...notification, show: false });

  const enforceFirstActiveIsInitial = (currentStages: Stage[]): Stage[] => {
    let firstActiveFound = false;
    return [...currentStages]
      .sort((a, b) => a.display_order - b.display_order)
      .map(s => {
        if (s.blnstatus && !firstActiveFound) {
          firstActiveFound = true;
          return { ...s, blninitial: true };
        }
        return { ...s, blninitial: false };
      });
  };

  const fetchPipelineAndOpportunities = async () => {
    setLoading(true);
    try {
      const pipelineData = await getMainPipeline();
      const loadedStages = enforceFirstActiveIsInitial(pipelineData.stages || []);
      setStages(loadedStages);
      setPipelineName(pipelineData.strname || 'Pipeline Comercial');
      setPipelineDescription(pipelineData.strdescription || '');

      // Determinar qué etapas mostrar u ocultar
      const activeStageIds = loadedStages.filter(s => s.blnstatus).map(s => s.id);
      setVisibleStageIds(prev => {
        if (prev.length === 0) return activeStageIds;
        // Mantener las etapas que ya eran visibles y siguen activas
        const stillVisible = prev.filter(id => activeStageIds.includes(id));
        // Agregar etapas que eran inactivas en el estado anterior y ahora están activas
        const newlyActive = activeStageIds.filter(id => {
          const prevStage = stages.find(s => s.id === id);
          return !prevStage || !prevStage.blnstatus;
        });
        return [...stillVisible, ...newlyActive];
      });

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
        message: 'No se pudieron cargar las etapas o las oportunidades',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (opportunity: Partial<Opportunity>) => {
    try {
      await createOpportunity(opportunity);
      setIsFormModalOpen(false);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: 'Oportunidad creada correctamente',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      fetchPipelineAndOpportunities();
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear la oportunidad',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    }
  };

  const handleUpdate = async (opportunity: Partial<Opportunity>) => {
    if (!opportunity.id) return;
    try {
      const { id, cliente, company, contacts, ejecutivo, stage, proposalDocumentPath, archived, ...updateData } = opportunity as any;
      await updateOpportunity(id, updateData);
      setEditingOpportunity(null);
      setIsFormModalOpen(false);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: 'Oportunidad actualizada correctamente',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      fetchPipelineAndOpportunities();
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar la oportunidad',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
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
        onCancel: hideNotification,
      });
      fetchPipelineAndOpportunities();
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar la oportunidad',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setIsConfirmModalOpen(false);
      setOpportunityToDelete(null);
    }
  };

  const openCreateModal = (stageId?: any) => {
    const sId = typeof stageId === 'string' ? stageId : undefined;
    const defaultStageId = sId || stages.find(s => s.blninitial)?.id || stages.filter(s => s.blnstatus)[0]?.id || '';
    setEditingOpportunity({ stage_id: defaultStageId } as Opportunity);
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
          setOpportunities(originalOpportunities);
        }
      },
      onCancel: hideNotification,
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const opportunity = opportunities.find(o => o.id === active.id);
    if (opportunity) {
      setActiveOpportunity(opportunity);
      setActiveStage(null);
    } else {
      const stage = stages.find(s => s.id === active.id);
      if (stage) {
        setActiveStage(stage);
        setActiveOpportunity(null);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpportunity(null);
    setActiveStage(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Verificar si estamos arrastrando una etapa/columna
    const isStageDrag = stages.some(s => s.id === activeId);
    if (isStageDrag) {
      if (activeId !== overId) {
        let targetStageId = overId;
        if (!visibleStageIds.includes(overId)) {
          const overOpp = opportunities.find(o => o.id === overId);
          if (overOpp) {
            targetStageId = overOpp.stage_id;
          }
        }

        const oldIndex = visibleStageIds.indexOf(activeId);
        const newIndex = visibleStageIds.indexOf(targetStageId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const originalVisibleStageIds = [...visibleStageIds];
          const originalStages = [...stages];

          const newVisibleIds = [...visibleStageIds];
          const [removed] = newVisibleIds.splice(oldIndex, 1);
          newVisibleIds.splice(newIndex, 0, removed);
          setVisibleStageIds(newVisibleIds);

          const newStages = enforceFirstActiveIsInitial(
            stages.map(s => {
              const visibleIdx = newVisibleIds.indexOf(s.id);
              if (visibleIdx !== -1) {
                return { ...s, display_order: visibleIdx };
              }
              return s;
            })
          );

          setStages(newStages);

          try {
            await updateMainPipeline({
              stages: newStages.map(s => ({
                id: s.id,
                strname: s.strname,
                blnstatus: s.blnstatus,
                display_order: s.display_order,
                strcolor: s.strcolor,
                blninitial: s.blninitial,
                pipeline_id: s.pipeline_id,
              })),
            });
          } catch (error) {
            setNotification({
              show: true,
              type: 'error',
              title: 'Error',
              message: 'No se pudo guardar el nuevo orden de las etapas',
              onConfirm: hideNotification,
              onCancel: hideNotification,
            });
            setStages(originalStages);
            setVisibleStageIds(originalVisibleStageIds);
          }
        }
      }
      return;
    }

    const opportunity = opportunities.find(o => o.id === activeId);
    if (!opportunity) return;

    const activeStageId = opportunity.stage_id;
    let overStageId = stages.find(s => s.id === overId && s.blnstatus)?.id;
    if (!overStageId) {
      overStageId = opportunities.find(o => o.id === overId)?.stage_id;
    }

    if (activeStageId && overStageId && activeStageId !== overStageId) {
      const originalOpportunities = [...opportunities];
      const updatedOpportunities = opportunities.map(o =>
        o.id === activeId ? { ...o, stage_id: overStageId! } : o
      );
      setOpportunities(updatedOpportunities);

      const targetStage = stages.find(s => s.id === overStageId);
      if (targetStage && targetStage.strname === 'Ganada') {
        setIsExploding(true);
        setTimeout(() => setIsExploding(false), 4000);
      }

      const opportunityToUpdate = updatedOpportunities.find(o => o.id === activeId);

      if (opportunityToUpdate) {
        const { id, cliente, company, contacts, ejecutivo, stage, proposalDocumentPath, archived, tipoCambio, ...rest } = opportunityToUpdate as any;
        const updateData = {
          ...rest,
          stage_id: overStageId,
          monto_licenciamiento: Number(rest.monto_licenciamiento) || 0,
          monto_servicios: Number(rest.monto_servicios) || 0,
          monto_total: Number(rest.monto_total) || 0,
        };

        updateOpportunity(id, updateData).catch(() => {
          setNotification({
            show: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo mover la oportunidad',
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
          setOpportunities(originalOpportunities);
        });
      }
    }
  };

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage) return;

    const nameTrimmed = editingStage.strname.trim();
    if (!nameTrimmed) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error de Validación',
        message: 'El nombre de la etapa no puede estar vacío.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      return;
    }

    const updatedStages = stages.map(s => {
      if (s.id === editingStage.id) {
        return {
          ...s,
          strname: nameTrimmed,
          blnstatus: editingStage.blnstatus,
        };
      }
      return s;
    });

    const activeStages = updatedStages.filter(s => s.blnstatus);
    if (activeStages.length === 0) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error de Validación',
        message: 'Debe existir al menos una etapa activa en el pipeline.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      return;
    }

    const initialActiveStages = activeStages.filter(s => s.blninitial);
    if (initialActiveStages.length !== 1) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error de Validación',
        message: 'Debe existir exactamente una etapa inicial activa. No se puede desactivar la etapa inicial sin asignar otra primero.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      return;
    }

    const names = updatedStages.map(s => s.strname.trim().toLowerCase());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error de Validación',
        message: 'No se permiten nombres duplicados de etapas.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      return;
    }

    try {
      setLoading(true);
      await updateMainPipeline({
        stages: updatedStages.map(s => ({
          id: s.id,
          strname: s.strname.trim(),
          blnstatus: s.blnstatus,
          display_order: s.display_order,
          strcolor: s.strcolor || '#3b82f6',
          blninitial: s.blninitial,
          pipeline_id: s.pipeline_id,
        })),
      });
      setEditingStage(null);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: 'Etapa actualizada correctamente',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      fetchPipelineAndOpportunities();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ocurrió un error al actualizar la etapa.';
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: Array.isArray(msg) ? msg.join(', ') : msg,
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableStage = async (stageToDisable: Stage) => {
    const updatedStages = enforceFirstActiveIsInitial(
      stages.map(s => {
        if (s.id === stageToDisable.id) {
          return { ...s, blnstatus: false };
        }
        return s;
      })
    );

    try {
      setLoading(true);
      await updateMainPipeline({
        stages: updatedStages.map(s => ({
          id: s.id,
          strname: s.strname.trim(),
          blnstatus: s.blnstatus,
          display_order: s.display_order,
          strcolor: s.strcolor || '#3b82f6',
          blninitial: s.blninitial,
          pipeline_id: s.pipeline_id,
        })),
      });
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: `Etapa "${stageToDisable.strname}" desactivada correctamente`,
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      fetchPipelineAndOpportunities();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ocurrió un error al desactivar la etapa.';
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: Array.isArray(msg) ? msg.join(', ') : msg,
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      fetchPipelineAndOpportunities();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = newStageName.trim();
    if (!nameTrimmed) return;

    const nameLower = nameTrimmed.toLowerCase();
    const nameExists = stages.some(s => s.strname.trim().toLowerCase() === nameLower);
    if (nameExists) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error de Validación',
        message: 'Ya existe una etapa con este nombre.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      return;
    }

    const nextDisplayOrder = stages.length;
    const newStage: Stage = {
      id: `temp-${Date.now()}`,
      strname: nameTrimmed,
      blnstatus: true,
      pipeline_id: '',
      display_order: nextDisplayOrder,
      strcolor: '#3b82f6',
      blninitial: false,
    };

    const updatedStages = enforceFirstActiveIsInitial([...stages, newStage]);

    try {
      setLoading(true);
      await updateMainPipeline({
        stages: updatedStages.map(s => {
          const payloadItem: any = {
            strname: s.strname.trim(),
            blnstatus: s.blnstatus,
            display_order: s.display_order,
            strcolor: s.strcolor || '#3b82f6',
            blninitial: s.blninitial,
          };
          if (s.id && !s.id.startsWith('temp-')) {
            payloadItem.id = s.id;
          }
          return payloadItem;
        }),
      });

      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: `Etapa "${nameTrimmed}" creada correctamente`,
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      setNewStageName('');
      setIsAddingStage(false);
      await fetchPipelineAndOpportunities();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ocurrió un error al crear la etapa.';
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: Array.isArray(msg) ? msg.join(', ') : msg,
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setLoading(false);
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
    const matchesStatus = statusFilter ? opp.stage_id === statusFilter : true;
    const matchesArchived = opp.archived === false || opp.archived === undefined;
    return matchesSearch && matchesExecutive && matchesStatus && matchesArchived;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setExecutiveFilter('');
    setStatusFilter('');
  };

  const handleStageVisibilityChange = (stageId: string) => {
    setVisibleStageIds(prev => {
      const isCurrentlyVisible = prev.includes(stageId);
      if (isCurrentlyVisible && prev.length <= 3) {
        setNotification({
          show: true,
          type: 'warning',
          title: 'Acción no permitida',
          message: 'Debes mantener al menos 3 etapas visibles.',
          onConfirm: hideNotification,
          onCancel: hideNotification,
        });
        return prev;
      }

      return isCurrentlyVisible
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId];
    });
  };

  useEffect(() => {
    fetchPipelineAndOpportunities();
  }, []);

  const getModalContent = () => {
    if (!editingOpportunity || !editingOpportunity.id) {
      return (
        <OpportunityForm
          initialData={editingOpportunity || undefined}
          onSubmit={handleCreate}
          onCancel={() => setIsFormModalOpen(false)}
        />
      );
    }

    const tabs = [
      { label: 'Datos', content: <OpportunityForm initialData={editingOpportunity} onSubmit={handleUpdate} onCancel={() => setIsFormModalOpen(false)} /> },
      { label: 'Actividades', content: <ActivitiesTab opportunityId={editingOpportunity.id} /> },
      { label: 'Historial', content: <InteractionsTab opportunityId={editingOpportunity.id} /> },
      { label: 'Recordatorios', content: <RemindersTab opportunityId={editingOpportunity.id} /> },
      { label: 'Propuesta', content: <ProposalTab opportunity={editingOpportunity} onUploadSuccess={(updatedOpp) => {
          setEditingOpportunity(updatedOpp);
          setOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o));
        }} /> 
      },
    ];
    return <Tabs tabs={tabs} />;
  };

  const activeStages = useMemo(() => {
    return stages
      .filter(s => s.blnstatus)
      .sort((a, b) => a.display_order - b.display_order);
  }, [stages]);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
        {isExploding && (          
          <div className="fixed top-0 left-0 w-full h-full z-[100] pointer-events-none">
            <Confetti
              deg={270}
              mode="boom"
              particleCount={150}
              spreadDeg={45}
              launchSpeed={3}
              effectCount={1}
              shapeSize={10}
              colors={['#22c55e', '#3b82f6', '#8b5cf6', '#a855f7', '#ffffff']}
            />
          </div>
        )}
        <Notification {...notification} />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
          <div className="flex justify-between items-start w-full md:w-auto">
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">{pipelineName}</h1>
              {pipelineDescription && (
                <p className="text-sm text-gray-500 mt-0.5">{pipelineDescription}</p>
              )}
            </div>
            <button 
                className="md:hidden p-2 text-gray-500 hover:text-indigo-600 bg-gray-100 rounded-full transition-colors"
                onClick={() => setShowToolbar(!showToolbar)}
            >
                {showToolbar ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          <div className={`${showToolbar ? 'flex' : 'hidden'} md:flex flex-col sm:flex-row w-full md:w-auto gap-3`}>
            <div className="relative w-full sm:w-auto" ref={stageSelectorRef}>
              <button
                className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                onClick={() => setShowStageSelector(!showStageSelector)}
              >
                <Columns size={16} />
                <span>Etapas</span>
              </button>
              {showStageSelector && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
                  <h4 className="font-semibold text-sm mb-2">Mostrar/Ocultar Etapas</h4>
                  <div className="space-y-2">
                    {activeStages.map(stage => {
                      const isChecked = visibleStageIds.includes(stage.id);
                      const isDisabled = isChecked && visibleStageIds.length <= 3;
                      return (
                        <label key={stage.id} className={`flex items-center space-x-2 text-sm ${isDisabled ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer'}`}>
                           <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => handleStageVisibilityChange(stage.id)}
                            className="hidden"
                          />
                          {isChecked ? <CheckSquare size={16} className={isDisabled ? 'text-gray-400' : 'text-blue-600'} /> : <Square size={16} className="text-gray-400" />}
                          <span>{stage.strname}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <button
                className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} />
                <span>Filtros</span>
              </button>
            <button
              className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
              onClick={openCreateModal}
            >
              <Plus size={18} /> Nueva Oportunidad
            </button>
            <button
              title="Configurar Pipeline"
              className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm transition-colors"
              onClick={() => setShowStagesConfig(true)}
            >
              <Settings2 size={18} />
              <span className="sm:hidden">Configurar Pipeline</span>
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
                  {activeStages.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.strname}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={`flex space-x-4 overflow-x-auto pb-4 hide-scrollbar ${!activeOpportunity ? 'snap-x snap-mandatory' : ''}`}>
            <SortableContext 
              items={activeStages.filter(stage => visibleStageIds.includes(stage.id)).map(s => s.id)}
              strategy={horizontalListSortingStrategy}
            >
              {activeStages.filter(stage => visibleStageIds.includes(stage.id)).map(stage => (
                <PipelineColumn key={stage.id}
                  stage={stage}
                  opportunities={filteredOpportunities.filter(opp => opp.stage_id === stage.id)}
                  onEdit={openEditModal}
                  onDelete={openDeleteConfirm}
                  onArchive={handleArchive}
                  stages={stages}
                  onEditStage={setEditingStage}
                  onDisableStage={handleDisableStage}
                  onAddOpportunity={openCreateModal}
                  isFolded={foldedStageIds.includes(stage.id)}
                  onFoldStage={stageId => setFoldedStageIds(prev => [...prev, stageId])}
                  onUnfoldStage={stageId => setFoldedStageIds(prev => prev.filter(id => id !== stageId))}
                />
              ))}
            </SortableContext>
            {/* Odoo-style quick stage creator column */}
            {!isAddingStage ? (
              <div
                onClick={() => setIsAddingStage(true)}
                className="flex flex-col min-h-[850px] w-[45px] sm:w-[50px] flex-shrink-0 snap-center rounded-xl bg-slate-100/50 hover:bg-slate-200/50 border border-dashed border-gray-300 hover:border-slate-400 transition-all duration-200 ease-in-out cursor-pointer items-center justify-start pt-6 shadow-sm select-none"
              >
                <div
                  className="flex items-center justify-center font-bold text-slate-500 hover:text-slate-700 tracking-wide text-[13px] sm:text-[14px] whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  » Agregar Etapa
                </div>
              </div>
            ) : (
              <div className="flex flex-col w-[85vw] md:w-[280px] flex-shrink-0 bg-white border border-gray-200 rounded-xl p-4 shadow-md min-h-[160px] h-fit snap-center transition-all duration-200">
                <h3 className="font-semibold text-slate-800 text-[14px] uppercase tracking-wider mb-3">Nueva Etapa</h3>
                <form onSubmit={handleCreateStage} className="flex flex-col gap-3">
                  <input
                    ref={addStageInputRef}
                    type="text"
                    value={newStageName}
                    onChange={e => setNewStageName(e.target.value)}
                    placeholder="Nombre de la etapa..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium w-full"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex-1 shadow-sm transition-colors cursor-pointer"
                    >
                      Añadir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingStage(false);
                        setNewStageName('');
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg flex-1 border border-gray-200 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          <DragOverlay>
            {activeOpportunity ? (
              <OpportunityCard
                opportunity={activeOpportunity}
                onEdit={() => {}}
                onDelete={() => {}}
                onArchive={() => {}}
                stages={stages}
                isOverlay
              />
            ) : activeStage ? (
              <div className="opacity-95 shadow-2xl scale-[1.02] rotate-1 cursor-grabbing">
                <PipelineColumn
                  stage={activeStage}
                  opportunities={filteredOpportunities.filter(opp => opp.stage_id === activeStage.id)}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onArchive={() => {}}
                  stages={stages}
                  onEditStage={() => {}}
                  onDisableStage={() => {}}
                  onAddOpportunity={() => {}}
                  isOverlay
                  isFolded={foldedStageIds.includes(activeStage.id)}
                  onFoldStage={() => {}}
                  onUnfoldStage={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
      </DndContext>
      <ConfirmModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        message={`¿Seguro que deseas eliminar la oportunidad "${opportunityToDelete?.nombre_proyecto}"?`}
      />
      <Modal open={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
        {getModalContent()}
      </Modal>

      {/* Modal: Editar Etapa */}
      <Modal open={editingStage !== null} onClose={() => setEditingStage(null)} maxWidth="max-w-md" height="h-auto">
        {editingStage && (
          <form onSubmit={handleSaveStage} className="space-y-6 p-2">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Settings2 size={18} className="text-indigo-600" />
              Editar Etapa: {editingStage.strname || 'Nueva'}
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Nombre de la Etapa</label>
                <input
                  type="text"
                  value={editingStage.strname}
                  onChange={e => setEditingStage({ ...editingStage, strname: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Ej. Propuesta"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setEditingStage(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Drawer: Configurar Pipeline */}
      {showStagesConfig && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowStagesConfig(false)}
          />
          {/* Panel */}
          <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Settings2 size={20} className="text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-800">Configurar Pipeline</h2>
              </div>
              <button
                onClick={() => setShowStagesConfig(false)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            {/* Drawer Body (scrollable) */}
            <div className="flex-1 overflow-y-auto p-6">
              <PipelineStagesSettings
                onlyPipelineDetails={false}
                onSaveSuccess={() => {
                  fetchPipelineAndOpportunities();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PipelinePage;
