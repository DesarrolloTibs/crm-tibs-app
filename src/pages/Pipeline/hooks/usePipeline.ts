import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { createAppSocket, safeDisconnect } from '../../../core/socket/socketClient';
import { useAuth } from '../../../hooks/useAuth';
import { useConfigStore } from '../../../store/useConfigStore';
import { showToast } from '../../../utils/toast';

// Modelos y Esquemas
import type {
  Opportunity,
  Stage,
  OpportunityCatalogOption,
  PipelineViewMode,
  FilterRule,
} from '../schemas/pipeline.schema';
import {
  filterOpportunities,
  calculatePipelineStats,
  getAllOpportunityContacts,
  exportOpportunitiesToPDF,
  exportOpportunitiesToCSV,
  validateStageForm,
} from '../utils/pipeline.helpers';

// Servicios REST
import {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  archiveOpportunity,
} from '../../../services/opportunitiesService';
import {
  getMainPipeline,
  updateMainPipeline,
} from '../../../services/pipelinesService';
import { getActiveCatalogOptions } from '../../../services/opportunityCatalogsService';
import type { Client } from '../../../core/models/Client';
import type { Company } from '../../../core/models/Company';
import type { Product } from '../../../core/models/Product';
import type { User } from '../../../core/models/User';
import type { OpportunityLabel } from '../../../core/models/OpportunityLabel';
import { getClients } from '../../../services/clientsService';
import { getCompanies } from '../../../services/companiesService';
import { getProducts } from '../../../services/productsService';
import { getOpportunityLabels } from '../../../services/opportunityLabelsService';
import { getUsers } from '../../../services/usersService';

export interface OpportunityCatalogs {
  clients: Client[];
  companies: Company[];
  products: Product[];
  opportunityLabels: OpportunityLabel[];
  deliveryTypes: OpportunityCatalogOption[];
  licensings: OpportunityCatalogOption[];
  executives: User[];
}

export interface UsePipelineOptions {
  defaultView?: PipelineViewMode;
}

export function usePipeline(options: UsePipelineOptions = {}) {
  const { defaultView = 'kanban' } = options;
  const { user, isAdmin } = useAuth();
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sensores DnD optimizados para mouse y touch
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // Estados del Pipeline
  const [stages, setStages] = useState<Stage[]>([]);
  const [visibleStageIds, setVisibleStageIds] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pipelineName, setPipelineName] = useState('Pipeline Comercial');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [businessLines, setBusinessLines] = useState<OpportunityCatalogOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales y Selección
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  // Etapas Plegadas
  const [foldedStageIds, setFoldedStageIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pipeline_folded_stages') || '[]');
    } catch {
      return [];
    }
  });

  // Vista Activa (Kanban vs Tabla) sincronizada con localStorage y URL query param
  const viewParam = searchParams.get('view') as PipelineViewMode | null;
  const [viewMode, setViewModeState] = useState<PipelineViewMode>(() => {
    if (viewParam === 'kanban' || viewParam === 'list') return viewParam;
    try {
      return (localStorage.getItem('pipeline_view_mode') as PipelineViewMode) || defaultView;
    } catch {
      return defaultView;
    }
  });

  const setViewMode = useCallback(
    (mode: PipelineViewMode) => {
      setViewModeState(mode);
      localStorage.setItem('pipeline_view_mode', mode);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('view', mode);
        return next;
      });
    },
    [setSearchParams]
  );

  // Paginación de Tabla
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filtros Básicos
  const [searchTerm, setSearchTerm] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [executiveFilter, setExecutiveFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [archivedFilter, setArchivedFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState<string>(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${currentYear}-12-31`);

  // Filtros Avanzados
  const [customRules, setCustomRules] = useState<FilterRule[]>([]);
  const [matchType, setMatchType] = useState<'any' | 'all'>('any');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isCustomFilterModalOpen, setIsCustomFilterModalOpen] = useState(false);
  const [isCustomFilterActive, setIsCustomFilterActive] = useState(false);

  // UI Toggles
  const [showFilters, setShowFilters] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showStagesConfig, setShowStagesConfig] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Gestión de nueva etapa rápida
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageMaxDays, setNewStageMaxDays] = useState('');
  const addStageInputRef = useRef<HTMLInputElement>(null);

  // Conexión WebSocket
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const isInitialConnectRef = useRef<boolean>(true);

  // Invariante de etapa inicial
  const enforceFirstActiveIsInitial = (s: Stage[]): Stage[] => {
    let found = false;
    return [...s]
      .sort((a, b) => a.display_order - b.display_order)
      .map((st) => {
        if (st.blnstatus && !found) {
          found = true;
          return { ...st, blninitial: true };
        }
        return { ...st, blninitial: false };
      });
  };

  // Persistencia de etapas plegadas
  useEffect(() => {
    localStorage.setItem('pipeline_folded_stages', JSON.stringify(foldedStageIds));
  }, [foldedStageIds]);

  // Enfoque al añadir etapa
  useEffect(() => {
    if (isAddingStage && addStageInputRef.current) {
      addStageInputRef.current.focus();
    }
  }, [isAddingStage]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    contactFilter,
    executiveFilter,
    statusFilter,
    priorityFilter,
    archivedFilter,
    isCustomFilterActive,
    pageSize,
    startDate,
    endDate,
  ]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node)
      ) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Catálogos auxiliares para el formulario de oportunidad (carga única bajo demanda, patrón Clientes)
  const [opportunityCatalogs, setOpportunityCatalogs] = useState<OpportunityCatalogs>({
    clients: [],
    companies: [],
    products: [],
    opportunityLabels: [],
    deliveryTypes: [],
    licensings: [],
    executives: [],
  });
  const [catalogsLoading, setCatalogsLoading] = useState(false);
  const isFetchingCatalogsRef = useRef<boolean>(false);
  const hasLoadedCatalogsRef = useRef<boolean>(false);

  const loadOpportunityCatalogs = useCallback(async () => {
    if (isFetchingCatalogsRef.current || hasLoadedCatalogsRef.current) return;
    isFetchingCatalogsRef.current = true;
    setCatalogsLoading(true);

    try {
      const [
        clientsData,
        companiesData,
        productsData,
        labelsData,
        blData,
        dtData,
        licData,
        usersData,
      ] = await Promise.all([
        getClients(),
        getCompanies(),
        getProducts(),
        getOpportunityLabels(),
        getActiveCatalogOptions('business-lines'),
        getActiveCatalogOptions('delivery-types'),
        getActiveCatalogOptions('licensings'),
        getUsers().catch(() => []),
      ]);

      setOpportunityCatalogs({
        clients: Array.isArray(clientsData) ? clientsData : [],
        companies: Array.isArray(companiesData) ? companiesData : [],
        products: Array.isArray(productsData) ? productsData : [],
        opportunityLabels: Array.isArray(labelsData) ? labelsData : [],
        deliveryTypes: Array.isArray(dtData) ? dtData : [],
        licensings: Array.isArray(licData) ? licData : [],
        executives: Array.isArray(usersData) ? usersData : [],
      });
      if (Array.isArray(blData) && blData.length > 0) {
        setBusinessLines(blData);
      }
      hasLoadedCatalogsRef.current = true;
    } catch (err) {
      console.error('Error al cargar catálogos de oportunidad:', err);
      showToast.error('No se pudieron sincronizar los catálogos del formulario');
    } finally {
      setCatalogsLoading(false);
      isFetchingCatalogsRef.current = false;
    }
  }, []);

  // Carga bajo demanda al abrir formulario o modal de filtro personalizado (no al montar la página)
  useEffect(() => {
    if ((isFormModalOpen || isCustomFilterModalOpen) && !hasLoadedCatalogsRef.current) {
      loadOpportunityCatalogs();
    }
  }, [isFormModalOpen, isCustomFilterModalOpen, loadOpportunityCatalogs]);

  // Invalidación por cambio de tenant/esquema
  useEffect(() => {
    hasLoadedCatalogsRef.current = false;
    isFetchingCatalogsRef.current = false;
  }, [schemaName]);

  // Carga principal de datos
  const fetchPipelineAndOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const pipelineData = await getMainPipeline();
      const loadedStages = enforceFirstActiveIsInitial(pipelineData.stages || []);
      setStages(loadedStages);
      setPipelineName(pipelineData.strname || 'Pipeline Comercial');
      setPipelineDescription(pipelineData.strdescription || '');

      const activeStageIds = loadedStages.filter((s) => s.blnstatus).map((s) => s.id);
      setVisibleStageIds((prev) => {
        if (prev.length === 0) return activeStageIds;
        const stillVisible = prev.filter((id) => activeStageIds.includes(id));
        const newlyActive = activeStageIds.filter((id) => {
          const p = stages.find((s) => s.id === id);
          return !p || !p.blnstatus;
        });
        return [...stillVisible, ...newlyActive];
      });

      let data: Opportunity[];
      if (archivedFilter === 'all') {
        const [active, archived] = await Promise.all([
          getOpportunities(startDate || undefined, endDate || undefined, false),
          getOpportunities(startDate || undefined, endDate || undefined, true),
        ]);
        data = [...active, ...archived];
      } else {
        data = await getOpportunities(
          startDate || undefined,
          endDate || undefined,
          archivedFilter === 'archived'
        );
      }

      if (Array.isArray(data)) {
        setOpportunities(data);
      } else {
        throw new Error('Formato de datos no reconocido');
      }
    } catch (err) {
      console.error('Error fetching pipeline & opportunities:', err);
      showToast.error('No se pudieron cargar las etapas o las oportunidades');
    } finally {
      setLoading(false);
    }
  }, [archivedFilter, startDate, endDate, stages]);

  const fetchPipelineRef = useRef(fetchPipelineAndOpportunities);
  fetchPipelineRef.current = fetchPipelineAndOpportunities;

  useEffect(() => {
    fetchPipelineAndOpportunities();
  }, [archivedFilter, schemaName, startDate, endDate]);

  // Conexión Socket.IO con namespace 'pipelines'
  useEffect(() => {
    const socket = createAppSocket({
      namespace: 'pipelines',
      query: { tenantSchema: schemaName || 'public' },
    });

    socket.on('connect', () => {
      setIsWsConnected(true);
      // Asegurar suscripción reactiva a la sala del tenant activo
      socket.emit('set_tenant', { tenantSchema: schemaName || 'public' });

      if (!isInitialConnectRef.current) {
        console.log('Reconectado a WebSocket de Pipeline. Sincronizando...');
        fetchPipelineRef.current();
      } else {
        isInitialConnectRef.current = false;
        console.log('Conectado a WebSocket de Pipeline');
      }
    });

    socket.on('disconnect', (reason) => {
      setIsWsConnected(false);
      console.warn('Desconexión en Pipelines WebSocket:', reason);
    });

    socket.on('connect_error', (err) => {
      setIsWsConnected(false);
      console.warn('Error de conexión en Pipelines WebSocket:', err.message);
    });

    socket.on('opportunityCreated', (newOpp: Opportunity) => {
      setOpportunities((prev) =>
        prev.some((o) => o.id === newOpp.id) ? prev : [newOpp, ...prev]
      );
    });

    socket.on('opportunityUpdated', (updatedOpp: Opportunity) => {
      setOpportunities((prev) =>
        prev.map((o) => (o.id === updatedOpp.id ? updatedOpp : o))
      );
    });

    socket.on('opportunityDeleted', (deletedId: string) => {
      setOpportunities((prev) => prev.filter((o) => o.id !== deletedId));
    });

    socket.on('pipelineUpdated', (pipelineData: any) => {
      if (pipelineData?.stages) {
        const loadedStages = enforceFirstActiveIsInitial(pipelineData.stages);
        setStages(loadedStages);
        if (pipelineData.strname) setPipelineName(pipelineData.strname);
        if (pipelineData.strdescription !== undefined) {
          setPipelineDescription(pipelineData.strdescription);
        }
      }
    });

    return () => {
      safeDisconnect(socket);
    };
  }, [schemaName]);

  // Abrir oportunidad si viene por URL param (?opportunityId=...)
  useEffect(() => {
    if (!loading && opportunities.length > 0) {
      const params = new URLSearchParams(location.search);
      const id = params.get('opportunityId');
      if (id) {
        const found = opportunities.find((o) => o.id === id);
        if (found) {
          setEditingOpportunity(found);
          setIsFormModalOpen(true);
          navigate(location.pathname, { replace: true });
        }
      }
    }
  }, [loading, opportunities, location.search, location.pathname, navigate]);

  // ── Operaciones CRUD ──

  const handleCreate = async (opportunity: Partial<Opportunity>) => {
    try {
      await createOpportunity(opportunity);
      setIsFormModalOpen(false);
      showToast.success('Oportunidad creada correctamente');
      fetchPipelineAndOpportunities();
    } catch (err) {
      console.error('Error al crear oportunidad:', err);
      showToast.error('No se pudo crear la oportunidad');
    }
  };

  const handleUpdate = async (opportunity: Partial<Opportunity>) => {
    if (!opportunity.id) {
      console.error('handleUpdate abortado: oportunidad sin id:', opportunity);
      return;
    }
    try {
      const {
        id,
        cliente,
        company,
        contacts,
        ejecutivo,
        stage,
        proposalDocumentPath,
        files,
        archived,
        products,
        linea_negocio,
        tipo_entrega,
        licenciamiento,
        ...updateData
      } = opportunity as any;
      await updateOpportunity(id, updateData);
      setEditingOpportunity(null);
      setIsFormModalOpen(false);
      showToast.success('Oportunidad actualizada correctamente');
      fetchPipelineAndOpportunities();
    } catch (err) {
      console.error('Error al actualizar oportunidad:', err);
      showToast.error('No se pudo actualizar la oportunidad');
    }
  };

  const handleDelete = async () => {
    if (!opportunityToDelete) return;
    try {
      await deleteOpportunity(opportunityToDelete.id);
      showToast.success('Oportunidad eliminada correctamente');
      fetchPipelineAndOpportunities();
    } catch {
      showToast.error('No se pudo eliminar la oportunidad');
    } finally {
      setIsConfirmModalOpen(false);
      setOpportunityToDelete(null);
    }
  };

  const openCreateModal = (stageId?: any) => {
    const sId = typeof stageId === 'string' ? stageId : undefined;
    const defaultStageId =
      sId ||
      stages.find((s) => s.blninitial)?.id ||
      stages.filter((s) => s.blnstatus)[0]?.id ||
      '';
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
    const orig = [...opportunities];
    setOpportunities(
      opportunities.map((o) =>
        o.id === opportunity.id ? { ...o, archived: isArchiving } : o
      )
    );
    try {
      await archiveOpportunity(opportunity.id, isArchiving);
      showToast.success(
        `Oportunidad ${isArchiving ? 'archivada' : 'desarchivada'} correctamente.`
      );
    } catch {
      showToast.error(
        `No se pudo ${isArchiving ? 'archivar' : 'desarchivar'} la oportunidad.`
      );
      setOpportunities(orig);
    }
  };

  // ── Drag & Drop Handlers ──

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const opp = opportunities.find((o) => o.id === active.id);
    if (opp) {
      setActiveOpportunity(opp);
      setActiveStage(null);
    } else {
      const s = stages.find((st) => st.id === active.id);
      if (s) {
        setActiveStage(s);
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

    // 1. Reordenamiento de Etapas
    if (stages.some((s) => s.id === activeId)) {
      if (!isAdmin || activeId === overId) return;
      let targetStageId = overId;
      if (!visibleStageIds.includes(overId)) {
        const o = opportunities.find((op) => op.id === overId);
        if (o) targetStageId = o.stage_id;
      }
      const oldIdx = visibleStageIds.indexOf(activeId);
      const newIdx = visibleStageIds.indexOf(targetStageId);
      if (oldIdx !== -1 && newIdx !== -1) {
        const origV = [...visibleStageIds];
        const origS = [...stages];
        const newV = [...visibleStageIds];
        const [removed] = newV.splice(oldIdx, 1);
        newV.splice(newIdx, 0, removed);
        setVisibleStageIds(newV);
        const newStages = enforceFirstActiveIsInitial(
          stages.map((s) => {
            const vi = newV.indexOf(s.id);
            return vi !== -1 ? { ...s, display_order: vi } : s;
          })
        );
        setStages(newStages);
        try {
          await updateMainPipeline({
            stages: newStages.map((s) => ({
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
        } catch {
          showToast.error('No se pudo guardar el nuevo orden de las etapas');
          setStages(origS);
          setVisibleStageIds(origV);
        }
      }
      return;
    }

    // 2. Mover Oportunidad a otra Etapa
    const opp = opportunities.find((o) => o.id === activeId);
    if (!opp) return;
    const overStageId =
      stages.find((s) => s.id === overId && s.blnstatus)?.id ||
      opportunities.find((o) => o.id === overId)?.stage_id;

    if (opp.stage_id && overStageId && opp.stage_id !== overStageId) {
      const orig = [...opportunities];
      const targetStage = stages.find((s) => s.id === overStageId);
      const updated = opportunities.map((o) =>
        o.id === activeId
          ? {
              ...o,
              stage_id: overStageId,
              stage_entered_at: new Date().toISOString(),
              stage: targetStage || o.stage,
            }
          : o
      );
      setOpportunities(updated);

      // Disparo de animación festiva si la etapa es ganada
      if (
        targetStage?.stage_type === 1 ||
        targetStage?.strname?.toLowerCase() === 'ganada'
      ) {
        setIsExploding(true);
        setTimeout(() => setIsExploding(false), 4000);
      }

      const updatedOpp = updated.find((o) => o.id === activeId);
      if (updatedOpp) {
        const {
          id,
          cliente,
          company,
          contacts,
          ejecutivo,
          stage,
          proposalDocumentPath,
          files,
          archived,
          tipoCambio,
          products,
          linea_negocio,
          tipo_entrega,
          licenciamiento,
          ...rest
        } = updatedOpp as any;
        updateOpportunity(id, {
          ...rest,
          stage_id: overStageId,
          monto_licenciamiento: Number(rest.monto_licenciamiento) || 0,
          monto_servicios: Number(rest.monto_servicios) || 0,
          monto_total: Number(rest.monto_total) || 0,
        }).catch(() => {
          showToast.error('No se pudo mover la oportunidad');
          setOpportunities(orig);
        });
      }
    }
  };

  // ── Gestión de Etapas ──

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage) return;

    const { isValid, errors: validationErrors } = await validateStageForm(editingStage);
    if (!isValid) {
      const firstError = Object.values(validationErrors)[0] || 'Datos de etapa inválidos';
      showToast.error(firstError);
      return;
    }

    const nameTrimmed = editingStage.strname.trim();
    if (!nameTrimmed) {
      showToast.error('El nombre de la etapa no puede estar vacío.');
      return;
    }
    const newStageType = Number(editingStage.stage_type ?? 0);
    const updatedStages = stages.map((s) => {
      if (s.id === editingStage.id) {
        return {
          ...s,
          strname: nameTrimmed,
          blnstatus: editingStage.blnstatus,
          intmaxdays: editingStage.intmaxdays,
          stage_type: newStageType,
        };
      }
      if (newStageType === 1 && (s.stage_type === 1 || Number(s.stage_type) === 1)) {
        return { ...s, stage_type: 0 };
      }
      if (newStageType === 2 && (s.stage_type === 2 || Number(s.stage_type) === 2)) {
        return { ...s, stage_type: 0 };
      }
      return s;
    });

    const activeS = updatedStages.filter((s) => s.blnstatus);
    if (!activeS.length) {
      showToast.error('Debe existir al menos una etapa activa en el pipeline.');
      return;
    }
    if (activeS.filter((s) => s.blninitial).length !== 1) {
      showToast.error('Debe existir exactamente una etapa inicial activa.');
      return;
    }
    const names = updatedStages.map((s) => s.strname.trim().toLowerCase());
    if (names.length !== new Set(names).size) {
      showToast.error('No se permiten nombres duplicados de etapas.');
      return;
    }

    try {
      setLoading(true);
      await updateMainPipeline({
        stages: updatedStages.map((s) => ({
          id: s.id,
          strname: s.strname.trim(),
          blnstatus: s.blnstatus,
          display_order: s.display_order,
          strcolor: s.strcolor || '#3b82f6',
          blninitial: s.blninitial,
          stage_type: Number(s.stage_type ?? 0),
          pipeline_id: s.pipeline_id,
          intmaxdays: s.intmaxdays,
        })),
      });
      setEditingStage(null);
      showToast.success('Etapa actualizada correctamente');
      fetchPipelineAndOpportunities();
    } catch (err: any) {
      showToast.error(
        Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : err.response?.data?.message || 'Error al actualizar la etapa.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisableStage = async (stageToDisable: Stage) => {
    const updatedStages = enforceFirstActiveIsInitial(
      stages.map((s) => (s.id === stageToDisable.id ? { ...s, blnstatus: false } : s))
    );
    try {
      setLoading(true);
      await updateMainPipeline({
        stages: updatedStages.map((s) => ({
          id: s.id,
          strname: s.strname.trim(),
          blnstatus: s.blnstatus,
          display_order: s.display_order,
          strcolor: s.strcolor || '#3b82f6',
          blninitial: s.blninitial,
          stage_type: Number(s.stage_type ?? 0),
          pipeline_id: s.pipeline_id,
          intmaxdays: s.intmaxdays,
        })),
      });
      showToast.success(`Etapa "${stageToDisable.strname}" desactivada correctamente`);
      fetchPipelineAndOpportunities();
    } catch (err: any) {
      showToast.error(
        Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : err.response?.data?.message || 'Error al desactivar la etapa.'
      );
      fetchPipelineAndOpportunities();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = newStageName.trim();
    if (!nameTrimmed) return;
    if (stages.some((s) => s.strname.trim().toLowerCase() === nameTrimmed.toLowerCase())) {
      showToast.error('Ya existe una etapa con este nombre.');
      return;
    }
    const daysLimit = newStageMaxDays.trim() === '' ? null : parseInt(newStageMaxDays, 10);
    const newStage: Stage = {
      id: `temp-${Date.now()}`,
      strname: nameTrimmed,
      blnstatus: true,
      pipeline_id: '',
      display_order: stages.length,
      strcolor: '#3b82f6',
      blninitial: false,
      stage_type: 0,
      intmaxdays: daysLimit,
    };

    const { isValid, errors: validationErrors } = await validateStageForm(newStage);
    if (!isValid) {
      const firstError = Object.values(validationErrors)[0] || 'Datos de etapa inválidos';
      showToast.error(firstError);
      return;
    }

    const updatedStages = enforceFirstActiveIsInitial([...stages, newStage]);
    try {
      setLoading(true);
      await updateMainPipeline({
        stages: updatedStages.map((s) => {
          const p: any = {
            strname: s.strname.trim(),
            blnstatus: s.blnstatus,
            display_order: s.display_order,
            strcolor: s.strcolor || '#3b82f6',
            blninitial: s.blninitial,
            stage_type: Number(s.stage_type ?? 0),
            intmaxdays: s.intmaxdays,
          };
          if (s.id && !s.id.startsWith('temp-')) p.id = s.id;
          return p;
        }),
      });
      showToast.success(`Etapa "${nameTrimmed}" creada correctamente`);
      setNewStageName('');
      setNewStageMaxDays('');
      setIsAddingStage(false);
      await fetchPipelineAndOpportunities();
    } catch (err: any) {
      showToast.error(
        Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : err.response?.data?.message || 'Error al crear la etapa.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStageVisibilityChange = (stageId: string) => {
    setVisibleStageIds((prev) => {
      if (prev.includes(stageId) && prev.length <= 3) {
        showToast.warning('Debes mantener al menos 3 etapas visibles.');
        return prev;
      }
      return prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId];
    });
  };

  // ── Limpieza y Aplicación de Filtros ──

  const handleClearFilters = () => {
    setSearchTerm('');
    setContactFilter('');
    setExecutiveFilter('');
    setStatusFilter('');
    setPriorityFilter(null);
    setArchivedFilter('active');
    setIsCustomFilterActive(false);
    setCustomRules([]);
    const cYear = new Date().getFullYear();
    setStartDate(`${cYear}-01-01`);
    setEndDate(`${cYear}-12-31`);
  };

  const handleApplyCustomFilter = () => {
    setIsCustomFilterActive(true);
    setIsCustomFilterModalOpen(false);
    if (includeArchived) {
      if (archivedFilter !== 'all') setArchivedFilter('all');
    } else {
      if (archivedFilter !== 'active') setArchivedFilter('active');
    }
  };

  // ── Mapeos y Cómputos Derivados ──

  const executives = useMemo(() => {
    const execs = new Map<string, { id: string; username: string }>();
    opportunities.forEach((o) => {
      if (o.ejecutivo?.id && !execs.has(o.ejecutivo.id)) {
        execs.set(o.ejecutivo.id, {
          id: o.ejecutivo.id,
          username: o.ejecutivo.username,
        });
      }
    });
    return Array.from(execs.values());
  }, [opportunities]);

  const contactsList = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    opportunities.forEach((opp) => {
      const contacts = getAllOpportunityContacts(opp);
      contacts.forEach((c) => {
        if (c.id && !map.has(c.id)) {
          map.set(c.id, { id: c.id, name: c.name });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [opportunities]);

  const activeStages = useMemo(
    () =>
      stages
        .filter((s) => s.blnstatus)
        .sort((a, b) => a.display_order - b.display_order),
    [stages]
  );

  const filtersState = useMemo(
    () => ({
      searchTerm,
      contactFilter,
      executiveFilter,
      statusFilter,
      archivedFilter,
      priorityFilter,
      startDate,
      endDate,
      isCustomFilterActive,
      customRules,
      matchType,
      includeArchived,
    }),
    [
      searchTerm,
      contactFilter,
      executiveFilter,
      statusFilter,
      archivedFilter,
      priorityFilter,
      startDate,
      endDate,
      isCustomFilterActive,
      customRules,
      matchType,
      includeArchived,
    ]
  );

  const filteredOpportunities = useMemo(
    () => filterOpportunities(opportunities, filtersState),
    [opportunities, filtersState]
  );

  const pipelineStats = useMemo(
    () => calculatePipelineStats(opportunities, stages),
    [opportunities, stages]
  );

  const totalPages =
    pageSize === 0 ? 1 : Math.ceil(filteredOpportunities.length / pageSize);

  const paginatedOpportunities = useMemo(
    () =>
      pageSize === 0
        ? filteredOpportunities
        : filteredOpportunities.slice(
            (currentPage - 1) * pageSize,
            currentPage * pageSize
          ),
    [filteredOpportunities, currentPage, pageSize]
  );

  const handleExportPDF = () => {
    exportOpportunitiesToPDF(filteredOpportunities, {
      title: `Reporte de Oportunidades — ${pipelineName}`,
    });
  };

  const handleExportCSV = () => {
    exportOpportunitiesToCSV(filteredOpportunities);
  };

  const getOperatorsForField = (field: string) => {
    if (field === 'nombre_proyecto' || field === 'empresa' || field === 'contacto') {
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
    if (field === 'nombre_proyecto' || field === 'empresa' || field === 'contacto') {
      defaultOperator = 'contains';
    }
    let defaultValue = '';
    if (field === 'linea_negocio') defaultValue = businessLines[0]?.strname || '';
    else if (field === 'stage_id') defaultValue = stages[0]?.id || '';
    else if (field === 'ejecutivo_id') defaultValue = executives[0]?.id || '';
    else if (field === 'priority') {
      defaultOperator = 'gt';
      defaultValue = '0';
    }
    setCustomRules((prev) =>
      prev.map((rule, i) =>
        i === idx ? { field, operator: defaultOperator, value: defaultValue } : rule
      )
    );
  };

  const handleRuleChange = (idx: number, key: keyof FilterRule, value: string) => {
    setCustomRules((prev) =>
      prev.map((rule, i) => (i === idx ? { ...rule, [key]: value } : rule))
    );
  };

  return {
    isAdmin,
    user,
    sensors,
    stages,
    visibleStageIds,
    opportunities,
    setOpportunities,
    pipelineName,
    pipelineDescription,
    businessLines,
    loading,
    editingOpportunity,
    setEditingOpportunity,
    opportunityToDelete,
    isFormModalOpen,
    setIsFormModalOpen,
    activeOpportunity,
    activeStage,
    editingStage,
    setEditingStage,
    foldedStageIds,
    setFoldedStageIds,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    searchTerm,
    setSearchTerm,
    contactFilter,
    setContactFilter,
    contactsList,
    executiveFilter,
    setExecutiveFilter,
    statusFilter,
    setStatusFilter,
    archivedFilter,
    setArchivedFilter,
    showFilters,
    setShowFilters,
    showToolbar,
    setShowToolbar,
    showStagesConfig,
    setShowStagesConfig,
    isExploding,
    priorityFilter,
    setPriorityFilter,
    searchDropdownRef,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    customRules,
    setCustomRules,
    matchType,
    setMatchType,
    includeArchived,
    setIncludeArchived,
    isCustomFilterModalOpen,
    setIsCustomFilterModalOpen,
    isCustomFilterActive,
    setIsCustomFilterActive,
    isAddingStage,
    setIsAddingStage,
    newStageName,
    setNewStageName,
    newStageMaxDays,
    setNewStageMaxDays,
    addStageInputRef,
    executives,
    activeStages,
    filteredOpportunities,
    paginatedOpportunities,
    totalPages,
    pipelineStats,
    fetchPipelineAndOpportunities,
    handleCreate,
    handleUpdate,
    handleDelete,
    openCreateModal,
    openEditModal,
    openDeleteConfirm,
    handleArchive,
    handleDragStart,
    handleDragEnd,
    handleSaveStage,
    handleDisableStage,
    handleCreateStage,
    handleStageVisibilityChange,
    handleClearFilters,
    handleApplyCustomFilter,
    getOperatorsForField,
    handleRuleFieldChange,
    handleRuleChange,
    handleExportPDF,
    handleExportCSV,
    isWsConnected,
    isConnected: isWsConnected,
    opportunityCatalogs,
    catalogsLoading,
    loadOpportunityCatalogs,
  };
}
