import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { useConfigStore } from '../store/useConfigStore';
import {
  getMainHelpdesk,
  updateMainHelpdesk,
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  archiveTicket,
} from '../services/ticketsService';
import { createOpportunity } from '../services/opportunitiesService';
import { getActiveStages } from '../services/pipelinesService';
import type { Helpdesk, TicketStage, Ticket } from '../core/models/Ticket';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface HelpdeskNotification {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const NOTIF_OFF: HelpdeskNotification = {
  show: false, type: 'success', title: '', message: '', onConfirm: () => {}, onCancel: () => {},
};

const EXPORT_HEADERS = ['Número','Asunto','Cliente / Contacto','Empresa / Correo','Incidencia','Prioridad','Apertura','Responsable','Etapa','Días en Etapa'];

export function useHelpdesk() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isEjecutivo, user: currentUser } = useAuth();
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;

  // ── dnd-kit sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // ── Data ──
  const [helpdesk, setHelpdesk] = useState<Helpdesk | null>(null);
  const [stages, setStages] = useState<TicketStage[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [commercialStages, setCommercialStages] = useState<any[]>([]);

  // ── Loading ──
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ── View ──
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showToolbar, setShowToolbar] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showStagesConfig, setShowStagesConfig] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Filters ──
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<number | 'all'>('all');
  const [incidenceTypeFilter, setIncidenceTypeFilter] = useState<string>('all');
  const [archivedFilter, setArchivedFilter] = useState<'active' | 'archived' | 'all'>('active');

  // ── Modals ──
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketToConvert, setTicketToConvert] = useState<Ticket | null>(null);
  const [editingStage, setEditingStage] = useState<TicketStage | null>(null);
  const [resolutionTicketInfo, setResolutionTicketInfo] = useState<{ ticketId: string; overStageId: string } | null>(null);
  const [resolutionNotesTemp, setResolutionNotesTemp] = useState('');

  // ── DnD state ──
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [activeStage, setActiveStage] = useState<TicketStage | null>(null);
  const [visibleStageIds, setVisibleStageIds] = useState<string[]>([]);
  const [foldedStageIds, setFoldedStageIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('helpdesk_folded_stages') || '[]'); } catch { return []; }
  });

  // ── Stage editing ──
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageMaxDays, setNewStageMaxDays] = useState('');
  const addStageInputRef = useRef<HTMLInputElement>(null);

  // ── Notification ──
  const [notification, setNotification] = useState<HelpdeskNotification>(NOTIF_OFF);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // ── Helpers ──
  const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));
  const showSuccess = (message: string) => setNotification({ show: true, type: 'success', title: '¡Éxito!', message, onConfirm: hideNotification, onCancel: hideNotification });
  const showError = (message: string) => setNotification({ show: true, type: 'error', title: 'Error', message, onConfirm: hideNotification, onCancel: hideNotification });

  const enforceFirstActiveIsInitial = (stgs: TicketStage[]): TicketStage[] => {
    let found = false;
    return [...stgs].sort((a, b) => a.display_order - b.display_order).map(s => {
      if (s.blnstatus && !found) { found = true; return { ...s, blninitial: true }; }
      return { ...s, blninitial: false };
    });
  };

  // ── Persist folded stages ──
  useEffect(() => { localStorage.setItem('helpdesk_folded_stages', JSON.stringify(foldedStageIds)); }, [foldedStageIds]);
  useEffect(() => { if (isAddingStage && addStageInputRef.current) addStageInputRef.current.focus(); }, [isAddingStage]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, priorityFilter, incidenceTypeFilter, archivedFilter, pageSize]);

  // ── Load data ──
  const loadData = async () => {
    setLoading(true);
    try {
      const hd = await getMainHelpdesk();
      setHelpdesk(hd);
      const sortedStages = (hd.stages || []).sort((a: TicketStage, b: TicketStage) => a.display_order - b.display_order);
      setStages(sortedStages);
      const activeStageIds = sortedStages.filter((s: TicketStage) => s.blnstatus).map((s: TicketStage) => s.id);
      setVisibleStageIds(prev => {
        if (prev.length === 0) return activeStageIds;
        const stillVisible = prev.filter((id: string) => activeStageIds.includes(id));
        const newlyActive = activeStageIds.filter((id: string) => !prev.includes(id));
        return [...stillVisible, ...newlyActive];
      });
      let tks: Ticket[];
      if (archivedFilter === 'all') {
        const [active, archived] = await Promise.all([getTickets(undefined, false), getTickets(undefined, true)]);
        tks = [...active, ...archived];
      } else {
        tks = await getTickets(undefined, archivedFilter === 'archived');
      }
      setTickets(tks);
      const cStages = await getActiveStages();
      setCommercialStages(cStages);
    } catch (err) {
      console.error('Error al cargar datos de Mesa de Ayuda:', err);
      showError('No se pudo cargar la información de la Mesa de Ayuda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [archivedFilter, schemaName]);

  // ── Socket.io ──
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
    const socket = io(socketUrl);
    socket.on('connect', () => console.log('Connected to WebSocket server'));
    socket.on('ticketCreated', (newTicket: Ticket) => {
      setTickets(prev => prev.some(t => t.id === newTicket.id) ? prev : [newTicket, ...prev]);
    });
    socket.on('ticketUpdated', (updated: Ticket) => {
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    });
    socket.on('ticketDeleted', (id: string) => {
      setTickets(prev => prev.filter(t => t.id !== id));
    });
    return () => { socket.disconnect(); };
  }, []);

  // ── URL ticketId deep-link ──
  useEffect(() => {
    if (!loading && tickets.length > 0) {
      const params = new URLSearchParams(location.search);
      const ticketId = params.get('ticketId');
      if (ticketId) {
        const found = tickets.find(t => t.id === ticketId);
        if (found) { setSelectedTicket(found); navigate(location.pathname, { replace: true }); }
      }
    }
  }, [loading, tickets, location.search]);

  // ── Click outside to close filter dropdown ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) setShowFilters(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Filtered & paginated tickets ──
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const numStr = t.ticket_number.toString().padStart(5, '0');
      const matchesSearch =
        t.strtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        numStr.includes(searchTerm) ||
        (t.cliente && `${t.cliente.nombre} ${t.cliente.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.contactName && t.contactName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesIncidence = incidenceTypeFilter === 'all' || t.tipo_incidencia === incidenceTypeFilter;
      const matchesArchived = archivedFilter === 'all' ? true : archivedFilter === 'archived' ? t.archived === true : (t.archived === false || t.archived === undefined);
      return matchesSearch && matchesPriority && matchesIncidence && matchesArchived;
    });
  }, [tickets, searchTerm, priorityFilter, incidenceTypeFilter, archivedFilter]);

  const uniqueIncidenceTypes = useMemo(() => Array.from(new Set(tickets.map(t => t.tipo_incidencia))), [tickets]);
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredTickets.length / pageSize);
  const paginatedTickets = useMemo(() =>
    pageSize === 0 ? filteredTickets : filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  [filteredTickets, currentPage, pageSize]);

  // ── Export ──
  const buildExportRows = () => filteredTickets.map(t => {
    const numStr = `#${t.ticket_number.toString().padStart(5, '0')}`;
    const customerName = t.cliente ? `${t.cliente.nombre} ${t.cliente.apellido}` : (t.contactName || 'Cliente Externo');
    const companyName = t.cliente ? (t.cliente.company?.nombre || t.cliente.empresa || '-') : (t.contactEmail || '-');
    const priorityLabel = t.priority === 1 ? 'Baja' : t.priority === 2 ? 'Media' : t.priority === 3 ? 'Alta' : 'Sin prioridad';
    const fechaApertura = new Date(t.fecha_apertura).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    const enteredDate = t.stage_entered_at ? new Date(t.stage_entered_at) : new Date(t.fecha_apertura);
    const days = Math.floor(Math.max(0, Date.now() - enteredDate.getTime()) / (1000 * 60 * 60 * 24));
    const limitDays = t.stage?.intmaxdays;
    return [numStr, t.strtitle||'', customerName, companyName, t.tipo_incidencia||'', priorityLabel, fechaApertura, t.responsable?.username||'Sin asignar', t.stage?.strname||'N/A', limitDays?`${days}d/${limitDays}d`:`${days}d`];
  });

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    doc.setFontSize(16); doc.setTextColor(40,40,40);
    doc.text('Reporte de Tickets - Mesa de Ayuda', 40, 40);
    doc.setFontSize(9); doc.setTextColor(100,100,100);
    doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, 40, 60);
    autoTable(doc, { head:[EXPORT_HEADERS], body:buildExportRows(), startY:75, styles:{fontSize:7,cellPadding:4,overflow:'linebreak'}, headStyles:{fillColor:[99,102,241],textColor:255,fontStyle:'bold'}, alternateRowStyles:{fillColor:[248,248,255]}, columnStyles:{0:{cellWidth:45},1:{cellWidth:100},2:{cellWidth:100},3:{cellWidth:100},4:{cellWidth:70},5:{cellWidth:50},6:{cellWidth:80},7:{cellWidth:70},8:{cellWidth:60},9:{cellWidth:60}} });
    doc.save(`tickets_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleExportCSV = () => {
    const rows = buildExportRows();
    const csvContent = [EXPORT_HEADERS.join(','), ...rows.map(r=>r.map(v=>{const e=String(v).replace(/"/g,'""');return /[,"\n\r]/.test(e)?`"${e}"`:e}).join(','))].join('\n');
    const blob = new Blob(['\ufeff'+csvContent],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`tickets_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ── Ticket CRUD ──
  const handleCreateTicketSubmit = async (payload: Partial<Ticket>) => {
    setActionLoading(true);
    try {
      await createTicket(payload);
      setIsCreatingTicket(false);
      showSuccess('Ticket creado con éxito.');
      setTickets(await getTickets());
    } catch (err: any) { showError(err.response?.data?.message || 'Error al crear el ticket.'); }
    finally { setActionLoading(false); }
  };

  const handleUpdateTicketSubmit = async (payload: Partial<Ticket>) => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await updateTicket(selectedTicket.id, payload);
      setSelectedTicket(null);
      showSuccess('Ticket actualizado con éxito.');
      setTickets(await getTickets());
    } catch (err: any) { showError(err.response?.data?.message || 'Error al actualizar el ticket.'); }
    finally { setActionLoading(false); }
  };

  const handleDeleteTicket = async (ticketToDeleteParam?: Ticket) => {
    const t = ticketToDeleteParam || selectedTicket;
    if (!t) return;
    setNotification({
      show: true, type: 'confirmation', title: 'Eliminar Ticket',
      message: `¿Eliminar permanentemente el ticket #${t.ticket_number.toString().padStart(5,'0')}?`,
      onConfirm: async () => {
        hideNotification(); setActionLoading(true);
        try {
          await deleteTicket(t.id);
          if (selectedTicket?.id === t.id) setSelectedTicket(null);
          showSuccess('Ticket eliminado.');
          setTickets(await getTickets());
        } catch (err: any) { showError(err.response?.data?.message || 'Error al eliminar el ticket.'); }
        finally { setActionLoading(false); }
      },
      onCancel: hideNotification,
    });
  };

  const handleArchive = async (ticket: Ticket) => {
    const isArchiving = !ticket.archived;
    setNotification({
      show: true, type: 'confirmation',
      title: `¿${isArchiving ? 'Archivar' : 'Desarchivar'} el ticket?`,
      message: isArchiving ? 'El ticket se ocultará de la vista principal.' : 'El ticket volverá a estar visible.',
      onConfirm: async () => {
        hideNotification();
        const original = [...tickets];
        setTickets(tickets.map(t => t.id === ticket.id ? {...t,archived:isArchiving} : t));
        setSelectedTicket(null);
        try {
          await archiveTicket(ticket.id, isArchiving);
          showSuccess(`Ticket ${isArchiving?'archivado':'desarchivado'} correctamente.`);
        } catch { showError(`No se pudo ${isArchiving?'archivar':'desarchivar'} el ticket.`); setTickets(original); }
      },
      onCancel: hideNotification,
    });
  };

  const handleConvertToOpportunityClick = (ticket: Ticket) => { setSelectedTicket(null); setTicketToConvert(ticket); };

  const handleConvertToOpportunitySubmit = async (payload: any) => {
    setActionLoading(true);
    try {
      await createOpportunity(payload);
      const resolvedStage = stages.find(s => s.strname === 'Resuelto');
      if (resolvedStage && ticketToConvert) {
        await updateTicket(ticketToConvert.id, { stage_id: resolvedStage.id, notas_resolucion: 'Convertido en oportunidad comercial.' });
      }
      setTicketToConvert(null);
      showSuccess('Oportunidad comercial creada correctamente y ticket resuelto.');
      setTickets(await getTickets());
    } catch (err: any) { showError(err.response?.data?.message || 'Error al convertir ticket a oportunidad.'); }
    finally { setActionLoading(false); }
  };

  // ── Stage management ──
  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage) return;
    const nameTrimmed = editingStage.strname.trim();
    if (!nameTrimmed) { showError('El nombre de la etapa no puede estar vacío.'); return; }
    const updatedStages = stages.map(s => s.id === editingStage.id ? {...s,strname:nameTrimmed,blnstatus:editingStage.blnstatus,intmaxdays:editingStage.intmaxdays} : s);
    const activeStages = updatedStages.filter(s => s.blnstatus);
    if (activeStages.length === 0) { showError('Debe existir al menos una etapa activa.'); return; }
    if (activeStages.filter(s => s.blninitial).length !== 1) { showError('Debe existir exactamente una etapa inicial activa.'); return; }
    const names = updatedStages.map(s => s.strname.trim().toLowerCase());
    if (names.length !== new Set(names).size) { showError('No se permiten nombres duplicados de etapas.'); return; }
    try {
      setLoading(true);
      await updateMainHelpdesk({ stages: updatedStages.map(s => ({id:s.id,strname:s.strname.trim(),blnstatus:s.blnstatus,display_order:s.display_order,strcolor:s.strcolor||'#6366f1',blninitial:s.blninitial,intmaxdays:s.intmaxdays,helpdesk_id:s.helpdesk_id,dtmcreated:s.dtmcreated,dtmlastmodified:s.dtmlastmodified})) });
      setEditingStage(null); showSuccess('Etapa actualizada correctamente'); loadData();
    } catch (err: any) { showError(Array.isArray(err.response?.data?.message) ? err.response.data.message.join(', ') : err.response?.data?.message || 'Error al actualizar la etapa.'); }
    finally { setLoading(false); }
  };

  const handleDisableStage = async (stageToDisable: TicketStage) => {
    const updatedStages = enforceFirstActiveIsInitial(stages.map(s => s.id === stageToDisable.id ? {...s,blnstatus:false} : s));
    try {
      setLoading(true);
      await updateMainHelpdesk({ stages: updatedStages.map(s => ({id:s.id,strname:s.strname.trim(),blnstatus:s.blnstatus,display_order:s.display_order,strcolor:s.strcolor||'#6366f1',blninitial:s.blninitial,intmaxdays:s.intmaxdays,helpdesk_id:s.helpdesk_id,dtmcreated:s.dtmcreated,dtmlastmodified:s.dtmlastmodified})) });
      showSuccess(`Etapa "${stageToDisable.strname}" desactivada correctamente`); loadData();
    } catch (err: any) { showError(Array.isArray(err.response?.data?.message) ? err.response.data.message.join(', ') : err.response?.data?.message || 'Error al desactivar la etapa.'); loadData(); }
    finally { setLoading(false); }
  };

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = newStageName.trim();
    if (!nameTrimmed) return;
    if (stages.some(s => s.strname.trim().toLowerCase() === nameTrimmed.toLowerCase())) { showError('Ya existe una etapa con este nombre.'); return; }
    const daysLimit = newStageMaxDays.trim() === '' ? null : parseInt(newStageMaxDays, 10);
    const newStage: TicketStage = { id:`temp-${Date.now()}`, strname:nameTrimmed, blnstatus:true, helpdesk_id:helpdesk?.id||'', display_order:stages.length, strcolor:'#6366f1', blninitial:false, intmaxdays:daysLimit, dtmcreated:new Date().toISOString(), dtmlastmodified:new Date().toISOString() };
    const updatedStages = enforceFirstActiveIsInitial([...stages, newStage]);
    try {
      setLoading(true);
      await updateMainHelpdesk({ stages: updatedStages.map(s => { const p: any = {strname:s.strname.trim(),blnstatus:s.blnstatus,display_order:s.display_order,strcolor:s.strcolor||'#6366f1',blninitial:s.blninitial,intmaxdays:s.intmaxdays}; if (s.id && !s.id.startsWith('temp-')) p.id=s.id; return p; }) });
      showSuccess(`Etapa "${nameTrimmed}" creada correctamente`);
      setNewStageName(''); setNewStageMaxDays(''); setIsAddingStage(false);
      await loadData();
    } catch (err: any) { showError(Array.isArray(err.response?.data?.message) ? err.response.data.message.join(', ') : err.response?.data?.message || 'Error al crear la etapa.'); }
    finally { setLoading(false); }
  };

  // ── Resolution modal ──
  const handleResolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionTicketInfo) return;
    if (!resolutionNotesTemp.trim()) { showError('Las notas de resolución son obligatorias.'); return; }
    const { ticketId, overStageId } = resolutionTicketInfo;
    const targetStage = stages.find(s => s.id === overStageId);
    const original = [...tickets];
    setTickets(tickets.map(t => t.id === ticketId ? {...t,stage_id:overStageId,stage_entered_at:new Date().toISOString(),stage:targetStage||t.stage,notas_resolucion:resolutionNotesTemp.trim(),fecha_cierre:new Date().toISOString()} : t));
    setResolutionTicketInfo(null); setResolutionNotesTemp('');
    try {
      await updateTicket(ticketId, {stage_id:overStageId,notas_resolucion:resolutionNotesTemp.trim()});
      showSuccess('Ticket resuelto correctamente.');
    } catch (err: any) { showError(err.response?.data?.message || 'Error al actualizar el ticket.'); setTickets(original); }
  };
  const handleResolutionCancel = () => { setResolutionTicketInfo(null); setResolutionNotesTemp(''); };

  // ── DnD handlers ──
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = tickets.find(t => t.id === active.id);
    if (ticket) { setActiveTicket(ticket); setActiveStage(null); }
    else { const stage = stages.find(s => s.id === active.id); if (stage) { setActiveStage(stage); setActiveTicket(null); } }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null); setActiveStage(null);
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    // Stage drag
    if (stages.some(s => s.id === activeId)) {
      if (activeId !== overId) {
        let targetStageId = overId;
        if (!visibleStageIds.includes(overId)) {
          const overTkt = tickets.find(t => t.id === overId);
          if (overTkt) targetStageId = overTkt.stage_id;
        }
        const oldIndex = visibleStageIds.indexOf(activeId);
        const newIndex = visibleStageIds.indexOf(targetStageId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const origVisible = [...visibleStageIds]; const origStages = [...stages];
          const newVisible = [...visibleStageIds]; const [removed] = newVisible.splice(oldIndex, 1); newVisible.splice(newIndex, 0, removed);
          setVisibleStageIds(newVisible);
          const newStages = enforceFirstActiveIsInitial(stages.map(s => { const vi = newVisible.indexOf(s.id); return vi !== -1 ? {...s,display_order:vi} : s; }));
          setStages(newStages);
          try {
            await updateMainHelpdesk({ stages: newStages.map(s => ({id:s.id,strname:s.strname,blnstatus:s.blnstatus,display_order:s.display_order,strcolor:s.strcolor,blninitial:s.blninitial,intmaxdays:s.intmaxdays,helpdesk_id:s.helpdesk_id,dtmcreated:s.dtmcreated,dtmlastmodified:s.dtmlastmodified})) });
          } catch { showError('No se pudo guardar el nuevo orden de las etapas'); setStages(origStages); setVisibleStageIds(origVisible); }
        }
      }
      return;
    }

    // Ticket drag
    const ticket = tickets.find(t => t.id === activeId);
    if (!ticket) return;
    if (!(isAdmin || (isEjecutivo && ticket.responsable_id === currentUser?.sub))) { showError('No tienes permiso para mover este ticket.'); return; }
    const activeStageId = ticket.stage_id;
    let overStageId = stages.find(s => s.id === overId && s.blnstatus)?.id;
    if (!overStageId) overStageId = tickets.find(t => t.id === overId)?.stage_id;
    if (activeStageId && overStageId && activeStageId !== overStageId) {
      const targetStage = stages.find(s => s.id === overStageId);
      if (targetStage && targetStage.strname === 'Resuelto') { setResolutionTicketInfo({ ticketId: activeId, overStageId }); return; }
      const original = [...tickets];
      setTickets(tickets.map(t => t.id === activeId ? {...t,stage_id:overStageId!,stage_entered_at:new Date().toISOString(),stage:targetStage||t.stage,fecha_cierre:null,notas_resolucion:null} : t));
      try { await updateTicket(activeId, { stage_id: overStageId, notas_resolucion: null }); }
      catch { showError('No se pudo mover el ticket'); setTickets(original); }
    }
  };

  const handleStageVisibilityChange = (stageId: string) => {
    setVisibleStageIds(prev => {
      if (prev.includes(stageId)) { if (prev.length <= 3) return prev; return prev.filter(id => id !== stageId); }
      return [...prev, stageId];
    });
  };

  return {
    // data
    helpdesk, stages, tickets, commercialStages,
    loading, actionLoading,
    // view
    viewMode, setViewMode, showToolbar, setShowToolbar,
    showFilters, setShowFilters, showStagesConfig, setShowStagesConfig,
    pageSize, setPageSize, currentPage, setCurrentPage,
    // filters
    searchTerm, setSearchTerm, priorityFilter, setPriorityFilter,
    incidenceTypeFilter, setIncidenceTypeFilter, archivedFilter, setArchivedFilter,
    uniqueIncidenceTypes, filteredTickets, paginatedTickets, totalPages,
    // modals
    selectedTicket, setSelectedTicket, isCreatingTicket, setIsCreatingTicket,
    ticketToConvert, setTicketToConvert, editingStage, setEditingStage,
    resolutionTicketInfo, resolutionNotesTemp, setResolutionNotesTemp,
    // dnd
    sensors, activeTicket, activeStage, visibleStageIds, foldedStageIds, setFoldedStageIds,
    isAddingStage, setIsAddingStage, newStageName, setNewStageName, newStageMaxDays, setNewStageMaxDays,
    addStageInputRef,
    // notification
    notification, hideNotification, searchDropdownRef,
    // actions
    loadData,
    handleCreateTicketSubmit, handleUpdateTicketSubmit, handleDeleteTicket, handleArchive,
    handleConvertToOpportunityClick, handleConvertToOpportunitySubmit,
    handleSaveStage, handleDisableStage, handleCreateStage,
    handleResolutionSubmit, handleResolutionCancel,
    handleDragStart, handleDragEnd, handleStageVisibilityChange,
    handleExportPDF, handleExportCSV,
    // auth
    isAdmin,
  };
}
