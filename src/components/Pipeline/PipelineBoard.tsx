import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import Confetti from 'react-confetti-boom';
import type { Opportunity, Stage } from '../../core/models/Opportunity';
import { getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity, archiveOpportunity } from '../../services/opportunitiesService';
import { getActiveCatalogOptions } from '../../services/opportunityCatalogsService';
import type { OpportunityCatalogOption } from '../../core/models/OpportunityCatalog';
import { getMainPipeline, updateMainPipeline } from '../../services/pipelinesService';
import Loader from '../Loader/Loader';
import PipelineColumn from './PipelineColumn';
import Modal from '../Modal/Modal';
import ConfirmModal from '../Modal/ConfirmModal';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../hooks/useAuth';
import OpportunityHistoryTable from './OpportunityHistoryTable';

import OpportunityCard from './OpportunityCard';
import { Plus, User, Tag, XCircle, Filter, ChevronUp, ChevronDown, Settings2, X, Trash2, Star, Kanban as KanbanIcon, List as ListIcon, FileText, FileSpreadsheet } from 'lucide-react';
import PipelineStagesSettings from './PipelineStagesSettings';
import OpportunityForm from './OpportunityForm';
import StageVisibilitySelector from '../shared/StageVisibilitySelector';
import Tabs from '../Tabs/Tabs';
import InteractionsTab from '../Interaction/InteractionsTab';
import FilesTab from '../Files/FilesTab';
import Notification from '../Modal/Notification';
import ActivitiesTab from '../Activity/ActivitiesTab';
import Button from '../shared/Button';
import UnifiedSearchBar from '../shared/UnifiedSearchBar';
import type { SearchBadge } from '../shared/UnifiedSearchBar';

interface FilterRule {
  field: string;
  operator: string;
  value: string;
}

const PipelinePage: React.FC = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [businessLines, setBusinessLines] = useState<OpportunityCatalogOption[]>([]);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const blOptions = await getActiveCatalogOptions('business-lines');
        setBusinessLines(blOptions);
      } catch (err) {
        console.error('Error loading business lines catalog in PipelineBoard:', err);
      }
    };
    loadCatalogs();
  }, []);
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

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
    try {
      return (localStorage.getItem('pipeline_view_mode') as 'kanban' | 'list') || 'kanban';
    } catch {
      return 'kanban';
    }
  });

  useEffect(() => {
    localStorage.setItem('pipeline_view_mode', viewMode);
  }, [viewMode]);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [executiveFilter, setExecutiveFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [archivedFilter, setArchivedFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [showFilters, setShowFilters] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showStagesConfig, setShowStagesConfig] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const [customRules, setCustomRules] = useState<FilterRule[]>([]);
  const [matchType, setMatchType] = useState<'any' | 'all'>('any');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isCustomFilterModalOpen, setIsCustomFilterModalOpen] = useState(false);
  const [isCustomFilterActive, setIsCustomFilterActive] = useState(false);

  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageMaxDays, setNewStageMaxDays] = useState('');
  const addStageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingStage && addStageInputRef.current) {
      addStageInputRef.current.focus();
    }
  }, [isAddingStage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, executiveFilter, statusFilter, priorityFilter, archivedFilter, isCustomFilterActive]);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => { },
    onCancel: () => { },
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

      let data: Opportunity[] = [];
      if (archivedFilter === 'all') {
        const [activeData, archivedData] = await Promise.all([
          getOpportunities(undefined, undefined, false),
          getOpportunities(undefined, undefined, true),
        ]);
        data = [...activeData, ...archivedData];
      } else {
        const showArchived = archivedFilter === 'archived';
        data = await getOpportunities(undefined, undefined, showArchived);
      }
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
      const { id, cliente, company, contacts, ejecutivo, stage, proposalDocumentPath, files, archived, products, linea_negocio, tipo_entrega, licenciamiento, ...updateData } = opportunity as any;
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
                intmaxdays: s.intmaxdays,
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
      const targetStage = stages.find(s => s.id === overStageId);
      const updatedOpportunities = opportunities.map(o =>
        o.id === activeId
          ? {
            ...o,
            stage_id: overStageId!,
            stage_entered_at: new Date().toISOString(),
            stage: targetStage || o.stage,
          }
          : o
      );
      setOpportunities(updatedOpportunities);

      if (targetStage && targetStage.strname === 'Ganada') {
        setIsExploding(true);
        setTimeout(() => setIsExploding(false), 4000);
      }

      const opportunityToUpdate = updatedOpportunities.find(o => o.id === activeId);

      if (opportunityToUpdate) {
        const { id, cliente, company, contacts, ejecutivo, stage, proposalDocumentPath, files, archived, tipoCambio, products, linea_negocio, tipo_entrega, licenciamiento, ...rest } = opportunityToUpdate as any;
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
          intmaxdays: editingStage.intmaxdays,
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
          intmaxdays: s.intmaxdays,
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
          intmaxdays: s.intmaxdays,
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

    const daysLimit = newStageMaxDays.trim() === '' ? null : parseInt(newStageMaxDays, 10);
    const nextDisplayOrder = stages.length;
    const newStage: Stage = {
      id: `temp-${Date.now()}`,
      strname: nameTrimmed,
      blnstatus: true,
      pipeline_id: '',
      display_order: nextDisplayOrder,
      strcolor: '#3b82f6',
      blninitial: false,
      intmaxdays: daysLimit,
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
            intmaxdays: s.intmaxdays,
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
      setNewStageMaxDays('');
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
    if (!isCustomFilterActive) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        opp.nombre_proyecto.toLowerCase().includes(term) ||
        (opp.cliente?.nombre && opp.cliente.nombre.toLowerCase().includes(term)) ||
        (opp.company?.nombre || opp.empresa || '').toLowerCase().includes(term);

      const matchesExecutive = executiveFilter ? opp.ejecutivo_id === executiveFilter : true;
      const matchesStatus = statusFilter ? opp.stage_id === statusFilter : true;
      const matchesPriority = priorityFilter !== null ? (opp.priority ?? 0) >= priorityFilter : true;
      const matchesArchived =
        archivedFilter === 'all'
          ? true
          : archivedFilter === 'archived'
            ? opp.archived === true
            : (opp.archived === false || opp.archived === undefined);
      return matchesSearch && matchesExecutive && matchesStatus && matchesPriority && matchesArchived;
    }

    if (!includeArchived && opp.archived) {
      return false;
    }

    const matchesRule = (rule: FilterRule): boolean => {
      let fieldValue: any = '';
      if (rule.field === 'nombre_proyecto') fieldValue = opp.nombre_proyecto;
      else if (rule.field === 'empresa') fieldValue = opp.company?.nombre || opp.empresa || '';
      else if (rule.field === 'linea_negocio') fieldValue = opp.linea_negocio?.strname || '';
      else if (rule.field === 'monto_total') fieldValue = Number(opp.monto_total) || 0;
      else if (rule.field === 'stage_id') fieldValue = opp.stage_id;
      else if (rule.field === 'ejecutivo_id') fieldValue = opp.ejecutivo_id;
      else if (rule.field === 'priority') fieldValue = opp.priority ?? 0;

      const val = rule.value.toLowerCase();
      const op = rule.operator;

      if (rule.field === 'monto_total') {
        const numVal = Number(rule.value) || 0;
        if (op === 'eq') return fieldValue === numVal;
        if (op === 'gt') return fieldValue > numVal;
        if (op === 'lt') return fieldValue < numVal;
        return true;
      }

      const strFieldValue = String(fieldValue || '').toLowerCase();
      if (op === 'eq') return strFieldValue === val;
      if (op === 'neq') return strFieldValue !== val;
      if (op === 'contains') return strFieldValue.includes(val);
      if (op === 'not_contains') return !strFieldValue.includes(val);
      return true;
    };

    if (customRules.length === 0) return true;

    if (matchType === 'any') {
      return customRules.some(matchesRule);
    } else {
      return customRules.every(matchesRule);
    }
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setExecutiveFilter('');
    setStatusFilter('');
    setPriorityFilter(null);
    setArchivedFilter('active');
    setIsCustomFilterActive(false);
    setCustomRules([]);
  };

  const totalPages = Math.ceil(filteredOpportunities.length / PAGE_SIZE);
  const paginatedOpportunities = useMemo(() =>
    filteredOpportunities.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    ), [filteredOpportunities, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const EXPORT_HEADERS = [
    'Proyecto',
    'Cliente',
    'Empresa',
    'Ejecutivo',
    'Etapa',
    'Monto',
    'Moneda',
    'Estado'
  ];

  const buildExportRows = () => {
    return filteredOpportunities.map(opp => {
      const clienteName = opp.company
        ? (opp.contacts?.map(c => `${c.nombre} ${c.apellido}`).join(', ') || 'Sin contactos')
        : (opp.cliente ? `${opp.cliente.nombre} ${opp.cliente.apellido}` : '-');
      const empresaName = opp.company ? opp.company.nombre : (opp.empresa || '-');
      const ejecutivoName = opp.ejecutivo?.username || 'No asignado';
      const stageName = opp.stage?.strname || 'Sin etapa';
      const formattedMonto = opp.monto_total !== undefined && opp.monto_total !== null ? opp.monto_total : 0;
      const monedaName = opp.moneda || 'MXN';
      const statusName = opp.archived ? 'Archivado' : 'Activo';

      return [
        opp.nombre_proyecto || '',
        clienteName,
        empresaName,
        ejecutivoName,
        stageName,
        `$${new Intl.NumberFormat('es-MX', { minimumFractionDigits: 0 }).format(formattedMonto)}`,
        monedaName,
        statusName
      ];
    });
  };

  const handleExportPDF = () => {
    const rows = buildExportRows();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte de Oportunidades', 40, 40);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, 40, 60);

    autoTable(doc, {
      head: [EXPORT_HEADERS],
      body: rows,
      startY: 75,
      styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak' },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      columnStyles: {
        0: { cellWidth: 150 }, // Proyecto
        1: { cellWidth: 110 }, // Cliente
        2: { cellWidth: 100 }, // Empresa
        3: { cellWidth: 80 },  // Ejecutivo
        4: { cellWidth: 80 },  // Etapa
        5: { cellWidth: 70 },  // Monto
        6: { cellWidth: 50 },  // Moneda
        7: { cellWidth: 50 },  // Estado
      },
    });

    doc.save(`oportunidades_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportCSV = () => {
    const rows = buildExportRows();
    const csvContent = [
      EXPORT_HEADERS.join(','),
      ...rows.map(row =>
        row.map(val => {
          const escaped = String(val).replace(/"/g, '""');
          return /[,\"\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `oportunidades_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getOperatorsForField = (field: string) => {
    if (field === 'nombre_proyecto' || field === 'empresa') {
      return [
        { value: 'contains', label: 'contiene' },
        { value: 'eq', label: 'es igual a' },
        { value: 'not_contains', label: 'no contiene' },
      ];
    }
    if (field === 'monto_total' || field === 'priority') {
      return [
        { value: 'eq', label: 'es igual a' },
        { value: 'gt', label: 'es mayor que' },
        { value: 'lt', label: 'es menor que' },
      ];
    }
    return [
      { value: 'eq', label: 'es igual a' },
      { value: 'neq', label: 'es diferente a' },
    ];
  };

  const handleRuleFieldChange = (idx: number, field: string) => {
    let defaultOperator = 'eq';
    if (field === 'nombre_proyecto' || field === 'empresa') {
      defaultOperator = 'contains';
    }

    let defaultValue = '';
    if (field === 'linea_negocio') defaultValue = businessLines[0]?.strname || '';
    else if (field === 'stage_id') defaultValue = stages[0]?.id || '';
    else if (field === 'ejecutivo_id') defaultValue = executives[0]?.id || '';
    else if (field === 'priority') { defaultOperator = 'gt'; defaultValue = '0'; }

    setCustomRules(prev => prev.map((rule, i) => i === idx ? { field, operator: defaultOperator, value: defaultValue } : rule));
  };

  const handleRuleChange = (idx: number, key: keyof FilterRule, value: string) => {
    setCustomRules(prev => prev.map((rule, i) => i === idx ? { ...rule, [key]: value } : rule));
  };

  const renderRuleValueInput = (rule: FilterRule, idx: number) => {
    if (rule.field === 'linea_negocio') {
      return (
        <select
          value={rule.value}
          onChange={e => handleRuleChange(idx, 'value', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full cursor-pointer"
        >
          <option value="" disabled>-- Seleccione --</option>
          {businessLines.map(bl => (
            <option key={bl.id} value={bl.strname}>{bl.strname}</option>
          ))}
        </select>
      );
    }
    if (rule.field === 'stage_id') {
      return (
        <select
          value={rule.value}
          onChange={e => handleRuleChange(idx, 'value', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full cursor-pointer"
        >
          {stages.map(s => (
            <option key={s.id} value={s.id}>{s.strname}</option>
          ))}
        </select>
      );
    }
    if (rule.field === 'ejecutivo_id') {
      return (
        <select
          value={rule.value}
          onChange={e => handleRuleChange(idx, 'value', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full cursor-pointer"
        >
          {executives.map(e => (
            <option key={e.id} value={e.id}>{e.username}</option>
          ))}
        </select>
      );
    }
    if (rule.field === 'priority') {
      return (
        <div className="flex items-center gap-1">
          {[1, 2, 3].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => handleRuleChange(idx, 'value', String(star))}
              className="p-0.5 transition-colors cursor-pointer"
              title={star === 1 ? 'Baja' : star === 2 ? 'Media' : 'Alta'}
            >
              <Star
                size={20}
                className={Number(rule.value) >= star ? 'text-amber-400 fill-current' : 'text-slate-300'}
              />
            </button>
          ))}
          <span className="text-xs text-slate-500 ml-2">
            {Number(rule.value) === 0 ? 'Sin prioridad' : Number(rule.value) === 1 ? 'Baja' : Number(rule.value) === 2 ? 'Media' : 'Alta'}
          </span>
        </div>
      );
    }
    if (rule.field === 'monto_total') {
      return (
        <input
          type="number"
          value={rule.value}
          onChange={e => handleRuleChange(idx, 'value', e.target.value)}
          placeholder="Monto..."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full"
          min="0"
          required
        />
      );
    }
    return (
      <input
        type="text"
        value={rule.value}
        onChange={e => handleRuleChange(idx, 'value', e.target.value)}
        placeholder="Valor..."
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full"
        required
      />
    );
  };

  const handleApplyCustomFilter = () => {
    setIsCustomFilterActive(true);
    setIsCustomFilterModalOpen(false);
    if (includeArchived) {
      if (archivedFilter !== 'all') {
        setArchivedFilter('all');
      }
    } else {
      if (archivedFilter !== 'active') {
        setArchivedFilter('active');
      }
    }
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
  }, [archivedFilter]);

  useEffect(() => {
    if (!loading && opportunities.length > 0) {
      const params = new URLSearchParams(location.search);
      const opportunityId = params.get('opportunityId');
      if (opportunityId) {
        const found = opportunities.find(o => o.id === opportunityId);
        if (found) {
          setEditingOpportunity(found);
          setIsFormModalOpen(true);
          // Limpiar el parámetro de la URL
          navigate(location.pathname, { replace: true });
        }
      }
    }
  }, [loading, opportunities, location.search]);

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
      {
        label: 'Archivos', content: <FilesTab opportunity={editingOpportunity} onUploadSuccess={(updatedOpp) => {
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

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];
    if (isCustomFilterActive) {
      list.push({
        id: 'custom',
        label: 'Filtro Personalizado',
        icon: <Filter size={10} />,
        onRemove: () => {
          setIsCustomFilterActive(false);
          setCustomRules([]);
        }
      });
    } else {
      if (archivedFilter === 'archived') {
        list.push({
          id: 'archived',
          label: 'Archivadas',
          icon: <Filter size={10} />,
          onRemove: () => setArchivedFilter('active')
        });
      }
      if (archivedFilter === 'all') {
        list.push({
          id: 'all',
          label: 'Todas',
          icon: <Filter size={10} />,
          onRemove: () => setArchivedFilter('active')
        });
      }
      if (executiveFilter) {
        list.push({
          id: 'executive',
          label: executives.find(e => e.id === executiveFilter)?.username || 'Ejecutivo',
          icon: <User size={10} className="shrink-0" />,
          onRemove: () => setExecutiveFilter('')
        });
      }
      if (statusFilter) {
        list.push({
          id: 'status',
          label: activeStages.find(s => s.id === statusFilter)?.strname || 'Estatus',
          icon: <Tag size={10} className="shrink-0" />,
          onRemove: () => setStatusFilter('')
        });
      }
      if (priorityFilter !== null) {
        const priorityLabel = priorityFilter === 1 ? '★ Baja+' : priorityFilter === 2 ? '★★ Media+' : '★★★ Alta';
        list.push({
          id: 'priority',
          label: priorityLabel,
          icon: <Star size={10} className="shrink-0" />,
          onRemove: () => setPriorityFilter(null)
        });
      }
    }
    return list;
  }, [isCustomFilterActive, archivedFilter, executiveFilter, statusFilter, priorityFilter, executives, activeStages]);

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

          <UnifiedSearchBar
            ref={searchDropdownRef}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={!executiveFilter && !statusFilter && priorityFilter === null && archivedFilter === 'active' && !isCustomFilterActive ? "Buscar..." : ""}
            badges={badges}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            dropdownWidthClass="w-[380px]"
          >
            {/* Column 1: Filters */}
            <div className="flex-1 flex flex-col gap-1.5 max-h-[320px] overflow-y-auto pr-1">
              <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none">
                <Filter size={12} /> Filtros
              </h4>

              {/* Archived Filter options */}
              <button
                type="button"
                onClick={() => setArchivedFilter(archivedFilter === 'archived' ? 'active' : 'archived')}
                className="flex items-center justify-between text-xs sm:text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer"
              >
                <span>Oportunidades Archivadas</span>
                {archivedFilter === 'archived' && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => setArchivedFilter(archivedFilter === 'all' ? 'active' : 'all')}
                className="flex items-center justify-between text-xs sm:text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer"
              >
                <span>Todas las Oportunidades</span>
                {archivedFilter === 'all' && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
              </button>

              <div className="border-t border-gray-100 my-1 shrink-0"></div>



              {/* Priority Quick Filter */}
              <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider px-2 mt-1 mb-1 shrink-0 select-none">Prioridad</h5>
              <div className="flex items-center gap-0.5 px-2 py-1">
                {[1, 2, 3].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPriorityFilter(priorityFilter === star ? null : star)}
                    title={star === 1 ? 'Baja o mayor' : star === 2 ? 'Media o mayor' : 'Alta'}
                    className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      size={18}
                      className={priorityFilter !== null && star <= priorityFilter ? 'text-amber-400 fill-current' : 'text-slate-300 hover:text-amber-300'}
                    />
                  </button>
                ))}
                {priorityFilter !== null && (
                  <span className="text-[10px] text-slate-500 ml-1">
                    {priorityFilter === 1 ? 'Baja+' : priorityFilter === 2 ? 'Media+' : 'Alta'}
                  </span>
                )}
              </div>
              {/* Stages List */}
              <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider px-2 mt-1 mb-1 shrink-0 select-none">Etapas</h5>
              {activeStages.map(stage => {
                const isSelected = statusFilter === stage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setStatusFilter(isSelected ? '' : stage.id)}
                    className="flex items-center gap-2 text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.strcolor || '#3b82f6' }} />
                    <span className="truncate flex-grow">{stage.strname}</span>
                    {isSelected && <span className="text-indigo-600 font-extrabold text-sm ml-auto">✓</span>}
                  </button>
                );
              })}
              <div className="border-t border-gray-100 my-1 shrink-0"></div>
              <div className="border-t border-gray-100 my-1 shrink-0"></div>
              <button
                type="button"
                onClick={() => { setShowFilters(false); setIsCustomFilterModalOpen(true); }}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1.5 rounded w-full text-left hover:bg-indigo-50 transition-colors cursor-pointer shrink-0 font-bold"
              >
                <span>+ Filtro personalizado...</span>
              </button>
            </div>

            {/* Column 2: Executives */}
            <div className="flex-1 flex flex-col gap-1.5 border-l border-gray-100 pl-4 max-h-[320px] overflow-y-auto">
              <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none">
                <User size={12} /> Ejecutivos
              </h4>
              {executives.map(exec => {
                const isSelected = executiveFilter === exec.id;
                return (
                  <button
                    key={exec.id}
                    type="button"
                    onClick={() => setExecutiveFilter(isSelected ? '' : exec.id)}
                    className="flex items-center justify-between text-xs sm:text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer"
                  >
                    <span className="truncate">{exec.username}</span>
                    {isSelected && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
                  </button>
                );
              })}

              {/* Clear Filters option at bottom */}
              <div className="border-t border-gray-100 my-1 mt-auto shrink-0"></div>
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              >
                <XCircle size={12} />
                Limpiar Filtros
              </button>
            </div>
          </UnifiedSearchBar>
          {/* View toggle + Etapas: always side-by-side */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* View mode toggle with labels */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden p-0.5 bg-gray-50 shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 flex items-center gap-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Vista Kanban"
              >
                <KanbanIcon size={14} />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 flex items-center gap-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Vista Lista"
              >
                <ListIcon size={14} />
                <span>Lista</span>
              </button>
            </div>

            {/* Etapas — next to the toggle, only in Kanban */}
            {viewMode === 'kanban' && (
              <StageVisibilitySelector
                stages={stages}
                visibleStageIds={visibleStageIds}
                onVisibilityChange={handleStageVisibilityChange}
                zIndex={20}
                labelSize="sm"
                themeColor="blue"
                align="left"
              />
            )}
          </div>

          {/* Botones de Exportación (solo en vista Lista) */}
          {viewMode === 'list' && (
            <>
              <Button
                type="button"
                onClick={handleExportPDF}
                variant="secondary"
                className="text-red-500 border border-blue-100 hover:bg-red-50/50 w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center font-bold text-xs tracking-wider"
              >
                <FileText size={16} className="text-red-500 mr-2" />
                <span>PDF</span>
              </Button>
              <Button
                type="button"
                onClick={handleExportCSV}
                variant="secondary"
                className="text-emerald-600 border border-blue-100 hover:bg-emerald-50/50 w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center font-bold text-xs tracking-wider"
              >
                <FileSpreadsheet size={16} className="text-emerald-600 mr-2" />
                <span>EXCEL</span>
              </Button>
            </>
          )}

          <Button
            variant="success"
            className="w-full sm:w-auto h-[38px] py-0 px-4 whitespace-nowrap"
            onClick={openCreateModal}
          >
            <Plus size={18} className="mr-2" /> Nueva Oportunidad
          </Button>
          <Button
            title="Configurar Pipeline"
            variant="secondary"
            className="w-full sm:w-auto h-[38px] py-0 px-3 whitespace-nowrap flex items-center justify-center"
            onClick={() => setShowStagesConfig(true)}
          >
            <Settings2 size={18} className="sm:mr-2" />
            <span className="hidden sm:inline"></span>
          </Button>
        </div>
      </div>
      {viewMode === 'kanban' ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={`flex space-x-4 overflow-x-auto pb-4 hide-scrollbar ${!activeOpportunity && !activeStage ? 'snap-x snap-mandatory' : ''}`}>
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
              <div className="flex flex-col w-[85vw] md:w-[330px] flex-shrink-0 bg-white border border-gray-200 rounded-xl p-4 shadow-md min-h-[220px] h-fit snap-center transition-all duration-200">
                <h3 className="font-semibold text-slate-800 text-[14px] uppercase tracking-wider mb-3">Nueva Etapa</h3>
                <form onSubmit={handleCreateStage} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Nombre</label>
                    <input
                      ref={addStageInputRef}
                      type="text"
                      value={newStageName}
                      onChange={e => setNewStageName(e.target.value)}
                      placeholder="Nombre de la etapa..."
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium w-full"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Límite de días (opcional)</label>
                    <input
                      type="number"
                      min="0"
                      value={newStageMaxDays}
                      onChange={e => setNewStageMaxDays(e.target.value)}
                      placeholder="Ej. 15 (vacío = sin límite)"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
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
                        setNewStageMaxDays('');
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
                onEdit={() => { }}
                onDelete={() => { }}
                onArchive={() => { }}
                stages={stages}
                isOverlay
              />
            ) : activeStage ? (
              <div className="opacity-95 shadow-2xl scale-[1.02] rotate-1 cursor-grabbing">
                <PipelineColumn
                  stage={activeStage}
                  opportunities={filteredOpportunities.filter(opp => opp.stage_id === activeStage.id)}
                  onEdit={() => { }}
                  onDelete={() => { }}
                  onArchive={() => { }}
                  stages={stages}
                  onEditStage={() => { }}
                  onDisableStage={() => { }}
                  onAddOpportunity={() => { }}
                  isOverlay
                  isFolded={foldedStageIds.includes(activeStage.id)}
                  onFoldStage={() => { }}
                  onUnfoldStage={() => { }}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <OpportunityHistoryTable
          opportunities={paginatedOpportunities}
          onEdit={openEditModal}
          onDelete={openDeleteConfirm}
          onArchive={handleArchive}
          isAdmin={isAdmin}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
      <ConfirmModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        message={`¿Seguro que deseas eliminar la oportunidad "${opportunityToDelete?.nombre_proyecto}"?`}
      />
      <Modal open={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} maxWidth="max-w-6xl">
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
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Límite de Días</label>
                <input
                  type="number"
                  min="0"
                  value={editingStage.intmaxdays !== undefined && editingStage.intmaxdays !== null ? editingStage.intmaxdays : ''}
                  onChange={e => {
                    const val = e.target.value;
                    setEditingStage({ ...editingStage, intmaxdays: val === '' ? null : parseInt(val, 10) });
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Ej. 15 (dejar vacío para sin límite)"
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
          <div className="relative w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
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
      {/* Odoo style custom filter builder modal */}
      {isCustomFilterModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Filter size={18} className="text-indigo-600" />
                Filtro Personalizado
              </h3>
              <button
                onClick={() => setIsCustomFilterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-grow overflow-y-auto flex flex-col gap-6">
              {/* Top Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 shrink-0">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span>Buscar oportunidades que cumplan</span>
                  <select
                    value={matchType}
                    onChange={e => setMatchType(e.target.value as 'any' | 'all')}
                    className="border border-slate-300 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold text-indigo-700 cursor-pointer"
                  >
                    <option value="any">cualquiera de</option>
                    <option value="all">todas</option>
                  </select>
                  <span>las siguientes reglas:</span>
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={e => setIncludeArchived(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                  />
                  <span>Incluir archivadas</span>
                </label>
              </div>

              {/* Rules List */}
              <div className="flex flex-col gap-3">
                {customRules.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-3">
                    <p className="text-slate-500 text-sm">No has añadido ninguna regla de filtrado.</p>
                    <button
                      type="button"
                      onClick={() => setCustomRules([{ field: 'nombre_proyecto', operator: 'contains', value: '' }])}
                      className="bg-white border border-slate-300 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      + Añadir primera regla
                    </button>
                  </div>
                ) : (
                  customRules.map((rule, idx) => {
                    const availableOperators = getOperatorsForField(rule.field);
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                        {/* Field Selector */}
                        <select
                          value={rule.field}
                          onChange={e => handleRuleFieldChange(idx, e.target.value)}
                          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full sm:w-48 cursor-pointer"
                        >
                          <option value="nombre_proyecto">Nombre del Proyecto</option>
                          <option value="empresa">Empresa</option>
                          <option value="linea_negocio">Línea de Negocio</option>
                          <option value="monto_total">Monto Total</option>
                          <option value="priority">Prioridad</option>
                          <option value="stage_id">Etapa</option>
                          <option value="ejecutivo_id">Ejecutivo</option>
                        </select>

                        {/* Operator Selector */}
                        <select
                          value={rule.operator}
                          onChange={e => handleRuleChange(idx, 'operator', e.target.value)}
                          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full sm:w-40 cursor-pointer"
                        >
                          {availableOperators.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>

                        {/* Value input / selector */}
                        <div className="flex-1 w-full">
                          {renderRuleValueInput(rule, idx)}
                        </div>

                        {/* Trash Button */}
                        <button
                          type="button"
                          onClick={() => setCustomRules(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Eliminar regla"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setCustomRules(prev => [...prev, { field: 'nombre_proyecto', operator: 'contains', value: '' }])}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
              >
                + Añadir regla
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCustomFilterModalOpen(false)}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomFilter}
                  disabled={customRules.length === 0}
                  className={`px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer ${customRules.length === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                  Aplicar filtro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PipelinePage;
