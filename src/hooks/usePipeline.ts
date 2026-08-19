import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import type { Opportunity, Stage } from '../core/models/Opportunity';
import { getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity, archiveOpportunity } from '../services/opportunitiesService';
import { getActiveCatalogOptions } from '../services/opportunityCatalogsService';
import type { OpportunityCatalogOption } from '../core/models/OpportunityCatalog';
import { getMainPipeline, updateMainPipeline } from '../services/pipelinesService';
import { useAuth } from './useAuth';
import { useConfigStore } from '../store/useConfigStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface FilterRule { field: string; operator: string; value: string; }

export const normalizeSearchText = (text?: string | null): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const getAllOpportunityContacts = (opp: Opportunity): { id?: string; name: string; email?: string }[] => {
  const list: { id?: string; name: string; email?: string }[] = [];

  if (opp.cliente) {
    const fullName = `${opp.cliente.nombre || ''} ${opp.cliente.apellido || ''}`.trim();
    if (fullName) {
      list.push({ id: opp.cliente.id, name: fullName, email: opp.cliente.correo });
    }
  }

  if (opp.contacts && Array.isArray(opp.contacts)) {
    opp.contacts.forEach(c => {
      const fullName = `${c.nombre || ''} ${c.apellido || ''}`.trim();
      if (fullName && !list.some(existing => existing.id && existing.id === c.id)) {
        list.push({ id: c.id, name: fullName, email: c.correo });
      }
    });
  }

  if (opp.company?.contacts && Array.isArray(opp.company.contacts)) {
    opp.company.contacts.forEach(c => {
      const fullName = `${c.nombre || ''} ${c.apellido || ''}`.trim();
      if (fullName && !list.some(existing => existing.id && existing.id === c.id)) {
        list.push({ id: c.id, name: fullName, email: c.correo });
      }
    });
  }

  return list;
};

type NotifType = 'success' | 'error' | 'warning' | 'confirmation';
interface Notif { show: boolean; type: NotifType; title: string; message: string; onConfirm: () => void; onCancel: () => void; }
const NOTIF_OFF: Notif = { show: false, type: 'success', title: '', message: '', onConfirm: () => {}, onCancel: () => {} };

const EXPORT_HEADERS = ['Proyecto','Cliente','Empresa','Ejecutivo','Etapa','Monto','Moneda','Estado'];

export function usePipeline() {
  const { isAdmin } = useAuth();
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;
  const location = useLocation();
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const [stages, setStages] = useState<Stage[]>([]);
  const [visibleStageIds, setVisibleStageIds] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [businessLines, setBusinessLines] = useState<OpportunityCatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [foldedStageIds, setFoldedStageIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pipeline_folded_stages') || '[]'); } catch { return []; }
  });
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
    try { return (localStorage.getItem('pipeline_view_mode') as 'kanban' | 'list') || 'kanban'; } catch { return 'kanban'; }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [executiveFilter, setExecutiveFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [archivedFilter, setArchivedFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [showFilters, setShowFilters] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showStagesConfig, setShowStagesConfig] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState<string>(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${currentYear}-12-31`);
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
  const [notification, setNotification] = useState<Notif>(NOTIF_OFF);

  const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));
  const showSuccess = (msg: string) => setNotification({ show: true, type: 'success', title: '¡Éxito!', message: msg, onConfirm: hideNotification, onCancel: hideNotification });
  const showError = (msg: string) => setNotification({ show: true, type: 'error', title: 'Error', message: msg, onConfirm: hideNotification, onCancel: hideNotification });
  const showWarning = (msg: string) => setNotification({ show: true, type: 'warning', title: 'Aviso', message: msg, onConfirm: hideNotification, onCancel: hideNotification });
  const showConfirm = (title: string, msg: string, onConfirm: () => void) => setNotification({ show: true, type: 'confirmation', title, message: msg, onConfirm, onCancel: hideNotification });

  const enforceFirstActiveIsInitial = (s: Stage[]): Stage[] => {
    let found = false;
    return [...s].sort((a, b) => a.display_order - b.display_order).map(st => {
      if (st.blnstatus && !found) { found = true; return { ...st, blninitial: true }; }
      return { ...st, blninitial: false };
    });
  };

  useEffect(() => { localStorage.setItem('pipeline_folded_stages', JSON.stringify(foldedStageIds)); }, [foldedStageIds]);
  useEffect(() => { localStorage.setItem('pipeline_view_mode', viewMode); }, [viewMode]);
  useEffect(() => { if (isAddingStage && addStageInputRef.current) addStageInputRef.current.focus(); }, [isAddingStage]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, contactFilter, executiveFilter, statusFilter, priorityFilter, archivedFilter, isCustomFilterActive, pageSize, startDate, endDate]);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) setShowFilters(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    getActiveCatalogOptions('business-lines').then(setBusinessLines).catch(console.error);
  }, []);

  const fetchPipelineAndOpportunities = async () => {
    setLoading(true);
    try {
      const pipelineData = await getMainPipeline();
      const loadedStages = enforceFirstActiveIsInitial(pipelineData.stages || []);
      setStages(loadedStages);
      setPipelineName(pipelineData.strname || 'Pipeline Comercial');
      setPipelineDescription(pipelineData.strdescription || '');
      const activeStageIds = loadedStages.filter(s => s.blnstatus).map(s => s.id);
      setVisibleStageIds(prev => {
        if (prev.length === 0) return activeStageIds;
        const stillVisible = prev.filter(id => activeStageIds.includes(id));
        const newlyActive = activeStageIds.filter(id => { const p = stages.find(s => s.id === id); return !p || !p.blnstatus; });
        return [...stillVisible, ...newlyActive];
      });
      let data: Opportunity[];
      if (archivedFilter === 'all') {
        const [active, archived] = await Promise.all([
          getOpportunities(startDate || undefined, endDate || undefined, false),
          getOpportunities(startDate || undefined, endDate || undefined, true)
        ]);
        data = [...active, ...archived];
      } else {
        data = await getOpportunities(startDate || undefined, endDate || undefined, archivedFilter === 'archived');
      }
      if (Array.isArray(data)) setOpportunities(data);
      else throw new Error('Data format is incorrect');
    } catch { showError('No se pudieron cargar las etapas o las oportunidades'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPipelineAndOpportunities(); }, [archivedFilter, schemaName, startDate, endDate]);

  useEffect(() => {
    if (!loading && opportunities.length > 0) {
      const params = new URLSearchParams(location.search);
      const id = params.get('opportunityId');
      if (id) {
        const found = opportunities.find(o => o.id === id);
        if (found) { setEditingOpportunity(found); setIsFormModalOpen(true); navigate(location.pathname, { replace: true }); }
      }
    }
  }, [loading, opportunities, location.search]);

  const handleCreate = async (opportunity: Partial<Opportunity>) => {
    try { await createOpportunity(opportunity); setIsFormModalOpen(false); showSuccess('Oportunidad creada correctamente'); fetchPipelineAndOpportunities(); }
    catch { showError('No se pudo crear la oportunidad'); }
  };

  const handleUpdate = async (opportunity: Partial<Opportunity>) => {
    if (!opportunity.id) return;
    try {
      const { id, cliente, company, contacts, ejecutivo, stage, proposalDocumentPath, files, archived, products, linea_negocio, tipo_entrega, licenciamiento, ...updateData } = opportunity as any;
      await updateOpportunity(id, updateData);
      setEditingOpportunity(null); setIsFormModalOpen(false);
      showSuccess('Oportunidad actualizada correctamente'); fetchPipelineAndOpportunities();
    } catch { showError('No se pudo actualizar la oportunidad'); }
  };

  const handleDelete = async () => {
    if (!opportunityToDelete) return;
    try { await deleteOpportunity(opportunityToDelete.id); showSuccess('Oportunidad eliminada correctamente'); fetchPipelineAndOpportunities(); }
    catch { showError('No se pudo eliminar la oportunidad'); }
    finally { setIsConfirmModalOpen(false); setOpportunityToDelete(null); }
  };

  const openCreateModal = (stageId?: any) => {
    const sId = typeof stageId === 'string' ? stageId : undefined;
    const defaultStageId = sId || stages.find(s => s.blninitial)?.id || stages.filter(s => s.blnstatus)[0]?.id || '';
    setEditingOpportunity({ stage_id: defaultStageId } as Opportunity);
    setIsFormModalOpen(true);
  };

  const openEditModal = (opportunity: Opportunity) => { setEditingOpportunity(opportunity); setIsFormModalOpen(true); };

  const openDeleteConfirm = (opportunity: Opportunity) => { setOpportunityToDelete(opportunity); setIsConfirmModalOpen(true); };

  const handleArchive = async (opportunity: Opportunity) => {
    const isArchiving = !opportunity.archived;
    showConfirm(
      `¿Seguro que deseas ${isArchiving ? 'archivar' : 'desarchivar'} la oportunidad?`,
      isArchiving ? 'La oportunidad se ocultará de la vista principal.' : 'La oportunidad volverá a estar visible.',
      async () => {
        hideNotification();
        const orig = [...opportunities];
        setOpportunities(opportunities.map(o => o.id === opportunity.id ? { ...o, archived: isArchiving } : o));
        try { await archiveOpportunity(opportunity.id, isArchiving); showSuccess(`Oportunidad ${isArchiving ? 'archivada' : 'desarchivada'} correctamente.`); }
        catch { showError(`No se pudo ${isArchiving ? 'archivar' : 'desarchivar'} la oportunidad.`); setOpportunities(orig); }
      }
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const opp = opportunities.find(o => o.id === active.id);
    if (opp) { setActiveOpportunity(opp); setActiveStage(null); }
    else { const s = stages.find(st => st.id === active.id); if (s) { setActiveStage(s); setActiveOpportunity(null); } }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpportunity(null); setActiveStage(null);
    if (!over) return;
    const activeId = active.id as string, overId = over.id as string;

    if (stages.some(s => s.id === activeId)) {
      if (!isAdmin || activeId === overId) return;
      let targetStageId = overId;
      if (!visibleStageIds.includes(overId)) { const o = opportunities.find(op => op.id === overId); if (o) targetStageId = o.stage_id; }
      const oldIdx = visibleStageIds.indexOf(activeId), newIdx = visibleStageIds.indexOf(targetStageId);
      if (oldIdx !== -1 && newIdx !== -1) {
        const origV = [...visibleStageIds], origS = [...stages];
        const newV = [...visibleStageIds]; const [removed] = newV.splice(oldIdx, 1); newV.splice(newIdx, 0, removed);
        setVisibleStageIds(newV);
        const newStages = enforceFirstActiveIsInitial(stages.map(s => { const vi = newV.indexOf(s.id); return vi !== -1 ? { ...s, display_order: vi } : s; }));
        setStages(newStages);
        try { await updateMainPipeline({ stages: newStages.map(s => ({ id: s.id, strname: s.strname, blnstatus: s.blnstatus, display_order: s.display_order, strcolor: s.strcolor, blninitial: s.blninitial, pipeline_id: s.pipeline_id, intmaxdays: s.intmaxdays })) }); }
        catch { showError('No se pudo guardar el nuevo orden de las etapas'); setStages(origS); setVisibleStageIds(origV); }
      }
      return;
    }

    const opp = opportunities.find(o => o.id === activeId); if (!opp) return;
    let overStageId = stages.find(s => s.id === overId && s.blnstatus)?.id || opportunities.find(o => o.id === overId)?.stage_id;
    if (opp.stage_id && overStageId && opp.stage_id !== overStageId) {
      const orig = [...opportunities];
      const targetStage = stages.find(s => s.id === overStageId);
      const updated = opportunities.map(o => o.id === activeId ? { ...o, stage_id: overStageId!, stage_entered_at: new Date().toISOString(), stage: targetStage || o.stage } : o);
      setOpportunities(updated);
      if (targetStage?.strname === 'Ganada') { setIsExploding(true); setTimeout(() => setIsExploding(false), 4000); }
      const updatedOpp = updated.find(o => o.id === activeId);
      if (updatedOpp) {
        const { id, cliente, company, contacts, ejecutivo, stage, proposalDocumentPath, files, archived, tipoCambio, products, linea_negocio, tipo_entrega, licenciamiento, ...rest } = updatedOpp as any;
        updateOpportunity(id, { ...rest, stage_id: overStageId, monto_licenciamiento: Number(rest.monto_licenciamiento)||0, monto_servicios: Number(rest.monto_servicios)||0, monto_total: Number(rest.monto_total)||0 })
          .catch(() => { showError('No se pudo mover la oportunidad'); setOpportunities(orig); });
      }
    }
  };

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingStage) return;
    const nameTrimmed = editingStage.strname.trim();
    if (!nameTrimmed) { showError('El nombre de la etapa no puede estar vacío.'); return; }
    const newStageType = Number(editingStage.stage_type ?? 0);
    const updatedStages = stages.map(s => {
      if (s.id === editingStage.id) {
        return { ...s, strname: nameTrimmed, blnstatus: editingStage.blnstatus, intmaxdays: editingStage.intmaxdays, stage_type: newStageType };
      }
      if (newStageType === 1 && (s.stage_type === 1 || Number(s.stage_type) === 1)) {
        return { ...s, stage_type: 0 };
      }
      if (newStageType === 2 && (s.stage_type === 2 || Number(s.stage_type) === 2)) {
        return { ...s, stage_type: 0 };
      }
      return s;
    });
    const activeS = updatedStages.filter(s => s.blnstatus);
    if (!activeS.length) { showError('Debe existir al menos una etapa activa en el pipeline.'); return; }
    if (activeS.filter(s => s.blninitial).length !== 1) { showError('Debe existir exactamente una etapa inicial activa.'); return; }
    const names = updatedStages.map(s => s.strname.trim().toLowerCase());
    if (names.length !== new Set(names).size) { showError('No se permiten nombres duplicados de etapas.'); return; }
    try {
      setLoading(true);
      await updateMainPipeline({ stages: updatedStages.map(s => ({ id: s.id, strname: s.strname.trim(), blnstatus: s.blnstatus, display_order: s.display_order, strcolor: s.strcolor||'#3b82f6', blninitial: s.blninitial, stage_type: Number(s.stage_type ?? 0), pipeline_id: s.pipeline_id, intmaxdays: s.intmaxdays })) });
      setEditingStage(null); showSuccess('Etapa actualizada correctamente'); fetchPipelineAndOpportunities();
    } catch (err: any) { showError(Array.isArray(err.response?.data?.message) ? err.response.data.message.join(', ') : err.response?.data?.message || 'Error al actualizar la etapa.'); }
    finally { setLoading(false); }
  };

  const handleDisableStage = async (stageToDisable: Stage) => {
    const updatedStages = enforceFirstActiveIsInitial(stages.map(s => s.id === stageToDisable.id ? { ...s, blnstatus: false } : s));
    try {
      setLoading(true);
      await updateMainPipeline({ stages: updatedStages.map(s => ({ id: s.id, strname: s.strname.trim(), blnstatus: s.blnstatus, display_order: s.display_order, strcolor: s.strcolor||'#3b82f6', blninitial: s.blninitial, stage_type: Number(s.stage_type ?? 0), pipeline_id: s.pipeline_id, intmaxdays: s.intmaxdays })) });
      showSuccess(`Etapa "${stageToDisable.strname}" desactivada correctamente`); fetchPipelineAndOpportunities();
    } catch (err: any) { showError(Array.isArray(err.response?.data?.message) ? err.response.data.message.join(', ') : err.response?.data?.message || 'Error al desactivar la etapa.'); fetchPipelineAndOpportunities(); }
    finally { setLoading(false); }
  };

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = newStageName.trim(); if (!nameTrimmed) return;
    if (stages.some(s => s.strname.trim().toLowerCase() === nameTrimmed.toLowerCase())) { showError('Ya existe una etapa con este nombre.'); return; }
    const daysLimit = newStageMaxDays.trim() === '' ? null : parseInt(newStageMaxDays, 10);
    const newStage: Stage = { id: `temp-${Date.now()}`, strname: nameTrimmed, blnstatus: true, pipeline_id: '', display_order: stages.length, strcolor: '#3b82f6', blninitial: false, stage_type: 0, intmaxdays: daysLimit };
    const updatedStages = enforceFirstActiveIsInitial([...stages, newStage]);
    try {
      setLoading(true);
      await updateMainPipeline({ stages: updatedStages.map(s => { const p: any = { strname: s.strname.trim(), blnstatus: s.blnstatus, display_order: s.display_order, strcolor: s.strcolor||'#3b82f6', blninitial: s.blninitial, stage_type: Number(s.stage_type ?? 0), intmaxdays: s.intmaxdays }; if (s.id && !s.id.startsWith('temp-')) p.id = s.id; return p; }) });
      showSuccess(`Etapa "${nameTrimmed}" creada correctamente`);
      setNewStageName(''); setNewStageMaxDays(''); setIsAddingStage(false);
      await fetchPipelineAndOpportunities();
    } catch (err: any) { showError(Array.isArray(err.response?.data?.message) ? err.response.data.message.join(', ') : err.response?.data?.message || 'Error al crear la etapa.'); }
    finally { setLoading(false); }
  };

  const handleStageVisibilityChange = (stageId: string) => {
    setVisibleStageIds(prev => {
      if (prev.includes(stageId) && prev.length <= 3) { showWarning('Debes mantener al menos 3 etapas visibles.'); return prev; }
      return prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId];
    });
  };

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
    setIsCustomFilterActive(true); setIsCustomFilterModalOpen(false);
    if (includeArchived) { if (archivedFilter !== 'all') setArchivedFilter('all'); }
    else { if (archivedFilter !== 'active') setArchivedFilter('active'); }
  };

  const executives = useMemo(() => {
    const execs = new Map<string, { id: string; username: string }>();
    opportunities.forEach(o => { if (o.ejecutivo?.id && !execs.has(o.ejecutivo.id)) execs.set(o.ejecutivo.id, { id: o.ejecutivo.id, username: o.ejecutivo.username }); });
    return Array.from(execs.values());
  }, [opportunities]);

  const contactsList = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    opportunities.forEach(opp => {
      const contacts = getAllOpportunityContacts(opp);
      contacts.forEach(c => {
        if (c.id && !map.has(c.id)) {
          map.set(c.id, { id: c.id, name: c.name });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [opportunities]);

  const activeStages = useMemo(() => stages.filter(s => s.blnstatus).sort((a, b) => a.display_order - b.display_order), [stages]);

  const filteredOpportunities = useMemo(() => opportunities.filter(opp => {
    if (!isCustomFilterActive) {
      const term = normalizeSearchText(searchTerm);
      const oppContacts = getAllOpportunityContacts(opp);

      let matchesSearch = true;
      if (term) {
        const matchesProject = normalizeSearchText(opp.nombre_proyecto).includes(term);
        const matchesCompany = normalizeSearchText(opp.company?.nombre || opp.empresa || '').includes(term);
        const matchesContacts = oppContacts.some(c => 
          normalizeSearchText(c.name).includes(term) ||
          (c.email && normalizeSearchText(c.email).includes(term))
        );
        const matchesExecutive = normalizeSearchText(opp.ejecutivo?.username || '').includes(term);
        const matchesBusinessLine = normalizeSearchText(opp.linea_negocio?.strname || '').includes(term);

        matchesSearch = matchesProject || matchesCompany || matchesContacts || matchesExecutive || matchesBusinessLine;
      }

      const matchesContact = contactFilter 
        ? (opp.cliente_id === contactFilter || opp.cliente?.id === contactFilter || oppContacts.some(c => c.id === contactFilter))
        : true;
      const matchesExecutive = executiveFilter ? opp.ejecutivo_id === executiveFilter : true;
      const matchesStatus = statusFilter ? opp.stage_id === statusFilter : true;
      const matchesPriority = priorityFilter !== null ? (opp.priority ?? 0) >= priorityFilter : true;
      const matchesArchived = archivedFilter === 'all' ? true : archivedFilter === 'archived' ? opp.archived === true : (opp.archived === false || opp.archived === undefined);
      
      let matchesDate = true;
      if (startDate || endDate) {
        const oppDateStr = opp.createdAt ? (typeof opp.createdAt === 'string' ? opp.createdAt : (opp.createdAt as any).toISOString?.() || String(opp.createdAt)) : '';
        if (oppDateStr) {
          const oppDayStr = oppDateStr.substring(0, 10);
          if (startDate && oppDayStr < startDate) matchesDate = false;
          if (endDate && oppDayStr > endDate) matchesDate = false;
        }
      }
      return matchesSearch && matchesContact && matchesExecutive && matchesStatus && matchesPriority && matchesArchived && matchesDate;
    }
    if (!includeArchived && opp.archived) return false;
    if (customRules.length === 0) return true;

    const matchesRule = (rule: FilterRule): boolean => {
      let fv: any = '';
      if (rule.field === 'nombre_proyecto') fv = opp.nombre_proyecto;
      else if (rule.field === 'empresa') fv = opp.company?.nombre || opp.empresa || '';
      else if (rule.field === 'linea_negocio') fv = (opp as any).linea_negocio?.strname || '';
      else if (rule.field === 'monto_total') fv = Number(opp.monto_total) || 0;
      else if (rule.field === 'stage_id') fv = opp.stage_id;
      else if (rule.field === 'ejecutivo_id') fv = opp.ejecutivo_id;
      else if (rule.field === 'priority') fv = opp.priority ?? 0;
      else if (rule.field === 'contacto') {
        const contacts = getAllOpportunityContacts(opp);
        const val = normalizeSearchText(rule.value);
        if (rule.operator === 'eq') {
          return contacts.some(c => normalizeSearchText(c.name) === val || (c.email && normalizeSearchText(c.email) === val));
        }
        if (rule.operator === 'not_contains') {
          return !contacts.some(c => normalizeSearchText(c.name).includes(val) || (c.email && normalizeSearchText(c.email).includes(val)));
        }
        return contacts.some(c => normalizeSearchText(c.name).includes(val) || (c.email && normalizeSearchText(c.email).includes(val)));
      }

      const val = normalizeSearchText(rule.value), op = rule.operator;
      if (rule.field === 'monto_total') { const n = Number(rule.value)||0; return op==='eq'?fv===n:op==='gt'?fv>n:op==='lt'?fv<n:true; }
      if (rule.field === 'stage_id' || rule.field === 'ejecutivo_id' || rule.field === 'priority') {
        const sfv = String(fv || '');
        if (op === 'eq') return sfv === rule.value;
        if (op === 'neq') return sfv !== rule.value;
        return true;
      }
      const sfv = normalizeSearchText(String(fv || ''));
      if (op === 'eq') return sfv === val;
      if (op === 'neq') return sfv !== val;
      if (op === 'contains') return sfv.includes(val);
      if (op === 'not_contains') return !sfv.includes(val);
      return true;
    };

    return matchType === 'any' ? customRules.some(matchesRule) : customRules.every(matchesRule);
  }), [opportunities, searchTerm, contactFilter, executiveFilter, statusFilter, priorityFilter, archivedFilter, isCustomFilterActive, customRules, matchType, includeArchived, startDate, endDate]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredOpportunities.length / pageSize);
  const paginatedOpportunities = useMemo(() => pageSize === 0 ? filteredOpportunities : filteredOpportunities.slice((currentPage-1)*pageSize, currentPage*pageSize), [filteredOpportunities, currentPage, pageSize]);

  const buildExportRows = () => filteredOpportunities.map(opp => {
    const clienteName = opp.company ? ((opp as any).contacts?.map((c: any) => `${c.nombre} ${c.apellido}`).join(', ') || 'Sin contactos') : (opp.cliente ? `${opp.cliente.nombre} ${opp.cliente.apellido}` : '-');
    return [opp.nombre_proyecto||'', clienteName, opp.company?opp.company.nombre:(opp.empresa||'-'), opp.ejecutivo?.username||'No asignado', opp.stage?.strname||'Sin etapa', `$${new Intl.NumberFormat('es-MX',{minimumFractionDigits:0}).format(Number(opp.monto_total)||0)}`, opp.moneda||'MXN', opp.archived?'Archivado':'Activo'];
  });

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    doc.setFontSize(16); doc.setTextColor(40,40,40); doc.text('Reporte de Oportunidades', 40, 40);
    doc.setFontSize(9); doc.setTextColor(100,100,100); doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, 40, 60);
    autoTable(doc, { head:[EXPORT_HEADERS], body:buildExportRows(), startY:75, styles:{fontSize:8,cellPadding:5,overflow:'linebreak'}, headStyles:{fillColor:[59,130,246],textColor:255,fontStyle:'bold'}, alternateRowStyles:{fillColor:[245,248,255]}, columnStyles:{0:{cellWidth:150},1:{cellWidth:110},2:{cellWidth:100},3:{cellWidth:80},4:{cellWidth:80},5:{cellWidth:70},6:{cellWidth:50},7:{cellWidth:50}} });
    doc.save(`oportunidades_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleExportCSV = () => {
    const rows = buildExportRows();
    const csv = [EXPORT_HEADERS.join(','), ...rows.map(r => r.map(v => { const e=String(v).replace(/"/g,'""'); return /[,"\n\r]/.test(e)?`"${e}"`:e; }).join(','))].join('\n');
    const blob = new Blob(['\ufeff'+csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`oportunidades_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const getOperatorsForField = (field: string) => {
    if (field==='nombre_proyecto'||field==='empresa'||field==='contacto') return [{ value:'contains', label:'contiene' },{ value:'eq', label:'es igual a' },{ value:'not_contains', label:'no contiene' }];
    if (field==='monto_total'||field==='priority') return [{ value:'eq', label:'es igual a' },{ value:'gt', label:'es mayor que' },{ value:'lt', label:'es menor que' }];
    return [{ value:'eq', label:'es igual a' },{ value:'neq', label:'es diferente a' }];
  };

  const handleRuleFieldChange = (idx: number, field: string) => {
    let defaultOperator = 'eq';
    if (field==='nombre_proyecto'||field==='empresa'||field==='contacto') defaultOperator = 'contains';
    let defaultValue = '';
    if (field==='linea_negocio') defaultValue = businessLines[0]?.strname||'';
    else if (field==='stage_id') defaultValue = stages[0]?.id||'';
    else if (field==='ejecutivo_id') defaultValue = executives[0]?.id||'';
    else if (field==='priority') { defaultOperator='gt'; defaultValue='0'; }
    setCustomRules(prev => prev.map((rule, i) => i===idx ? { field, operator:defaultOperator, value:defaultValue } : rule));
  };

  const handleRuleChange = (idx: number, key: keyof FilterRule, value: string) => {
    setCustomRules(prev => prev.map((rule, i) => i===idx ? { ...rule, [key]:value } : rule));
  };

  return {
    isAdmin, sensors, stages, visibleStageIds, opportunities, setOpportunities, pipelineName, pipelineDescription,
    businessLines, loading, editingOpportunity, setEditingOpportunity, opportunityToDelete,
    isFormModalOpen, setIsFormModalOpen, activeOpportunity, activeStage, editingStage, setEditingStage,
    foldedStageIds, setFoldedStageIds, viewMode, setViewMode, currentPage, setCurrentPage,
    pageSize, setPageSize, isConfirmModalOpen, setIsConfirmModalOpen, searchTerm, setSearchTerm,
    contactFilter, setContactFilter, contactsList,
    executiveFilter, setExecutiveFilter, statusFilter, setStatusFilter, archivedFilter, setArchivedFilter,
    showFilters, setShowFilters, showToolbar, setShowToolbar, showStagesConfig, setShowStagesConfig,
    isExploding, priorityFilter, setPriorityFilter, searchDropdownRef,
    startDate, setStartDate, endDate, setEndDate,
    customRules, setCustomRules, matchType, setMatchType, includeArchived, setIncludeArchived,
    isCustomFilterModalOpen, setIsCustomFilterModalOpen, isCustomFilterActive, setIsCustomFilterActive,
    isAddingStage, setIsAddingStage, newStageName, setNewStageName, newStageMaxDays, setNewStageMaxDays,
    addStageInputRef, notification, hideNotification,
    executives, activeStages, filteredOpportunities, paginatedOpportunities, totalPages,
    fetchPipelineAndOpportunities,
    handleCreate, handleUpdate, handleDelete, openCreateModal, openEditModal, openDeleteConfirm,
    handleArchive, handleDragStart, handleDragEnd,
    handleSaveStage, handleDisableStage, handleCreateStage, handleStageVisibilityChange,
    handleClearFilters, handleApplyCustomFilter,
    getOperatorsForField, handleRuleFieldChange, handleRuleChange,
    handleExportPDF, handleExportCSV,
  };
}
