import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useAuth } from '../hooks/useAuth';
import { io, Socket } from 'socket.io-client';
import { 
  getMainHelpdesk, 
  updateMainHelpdesk, 
  getTickets, 
  createTicket, 
  updateTicket, 
  deleteTicket,
  archiveTicket
} from '../services/ticketsService';
import { createOpportunity } from '../services/opportunitiesService';
import { getActiveStages } from '../services/pipelinesService';
import type { Helpdesk, TicketStage, Ticket } from '../core/models/Ticket';
import TicketCard from '../components/Helpdesk/TicketCard';
import HelpdeskColumn from '../components/Helpdesk/HelpdeskColumn';
import HelpdeskStagesSettings from '../components/Helpdesk/HelpdeskStagesSettings';
import TicketsListTable from '../components/Helpdesk/TicketsListTable';
import TicketDetail from '../components/Helpdesk/TicketDetail';
import OpportunityForm from '../components/Pipeline/OpportunityForm';
import Modal from '../components/Modal/Modal';
import { 
  LifeBuoy, 
  Kanban as KanbanIcon, 
  List as ListIcon, 
  Plus, 
  X,
  XCircle,
  Settings2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Filter,
  Tag,
  Star,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Notification from '../components/Modal/Notification';
import Loader from '../components/Loader/Loader';
import StageVisibilitySelector from '../components/shared/StageVisibilitySelector';
import Input from '../components/shared/Input';
import TextArea from '../components/shared/TextArea';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';



const HelpdeskPage: React.FC = () => {
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

  const { isAdmin, isEjecutivo, user: currentUser } = useAuth();
  const [helpdesk, setHelpdesk] = useState<Helpdesk | null>(null);
  const [stages, setStages] = useState<TicketStage[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  // Loading & Saving states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Layout states
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<number | 'all'>('all');
  const [incidenceTypeFilter, setIncidenceTypeFilter] = useState<string>('all');
  const [archivedFilter, setArchivedFilter] = useState<'active' | 'archived' | 'all'>('active');

  // Selected Ticket (Detail View / Modal)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Conversion to Opportunity
  const [ticketToConvert, setTicketToConvert] = useState<Ticket | null>(null);
  const [commercialStages, setCommercialStages] = useState<any[]>([]);

  // Drag and drop states
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [activeStage, setActiveStage] = useState<TicketStage | null>(null);
  const [visibleStageIds, setVisibleStageIds] = useState<string[]>([]);
  const [foldedStageIds, setFoldedStageIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('helpdesk_folded_stages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('helpdesk_folded_stages', JSON.stringify(foldedStageIds));
  }, [foldedStageIds]);

  const [showStagesConfig, setShowStagesConfig] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [editingStage, setEditingStage] = useState<TicketStage | null>(null);

  // States for quick adding stages from Kanban
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageMaxDays, setNewStageMaxDays] = useState('');
  const addStageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingStage && addStageInputRef.current) {
      addStageInputRef.current.focus();
    }
  }, [isAddingStage]);

  // Resolution notes modal state
  const [resolutionTicketInfo, setResolutionTicketInfo] = useState<{ ticketId: string; overStageId: string } | null>(null);
  const [resolutionNotesTemp, setResolutionNotesTemp] = useState('');

  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Notification / Alert state
  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));

  const showSuccess = (message: string) => {
    setNotification({
      show: true,
      type: 'success',
      title: '¡Éxito!',
      message,
      onConfirm: hideNotification,
      onCancel: hideNotification,
    });
  };

  const showError = (message: string) => {
    setNotification({
      show: true,
      type: 'error',
      title: 'Error',
      message,
      onConfirm: hideNotification,
      onCancel: hideNotification,
    });
  };

  const enforceFirstActiveIsInitial = (currentStages: TicketStage[]): TicketStage[] => {
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

  const loadData = async () => {
    setLoading(true);
    try {
      const hd = await getMainHelpdesk();
      setHelpdesk(hd);
      
      const sortedStages = (hd.stages || []).sort((a, b) => a.display_order - b.display_order);
      setStages(sortedStages);
      
      const activeStageIds = sortedStages.filter(s => s.blnstatus).map(s => s.id);
      setVisibleStageIds(prev => {
        if (prev.length === 0) return activeStageIds;
        const stillVisible = prev.filter(id => activeStageIds.includes(id));
        const newlyActive = activeStageIds.filter(id => !prev.includes(id));
        return [...stillVisible, ...newlyActive];
      });

      let tks: Ticket[] = [];
      if (archivedFilter === 'all') {
        const [activeData, archivedData] = await Promise.all([
          getTickets(undefined, false),
          getTickets(undefined, true),
        ]);
        tks = [...activeData, ...archivedData];
      } else {
        const showArchived = archivedFilter === 'archived';
        tks = await getTickets(undefined, showArchived);
      }
      setTickets(tks);

      // Cargar etapas comerciales por si convierten a oportunidad
      const cStages = await getActiveStages();
      setCommercialStages(cStages);
    } catch (err) {
      console.error('Error al cargar datos de Mesa de Ayuda:', err);
      showError('No se pudo cargar la información de la Mesa de Ayuda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [archivedFilter]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
    const socket: Socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('ticketCreated', (newTicket: Ticket) => {
      setTickets(prev => {
        if (prev.some(t => t.id === newTicket.id)) return prev;
        return [newTicket, ...prev];
      });
    });

    socket.on('ticketUpdated', (updatedTicket: Ticket) => {
      setTickets(prev => {
        return prev.map(t => t.id === updatedTicket.id ? updatedTicket : t);
      });
    });

    socket.on('ticketDeleted', (deletedTicketId: string) => {
      setTickets(prev => prev.filter(t => t.id !== deletedTicketId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
    if (!loading && tickets.length > 0) {
      const params = new URLSearchParams(location.search);
      const ticketId = params.get('ticketId');
      if (ticketId) {
        const found = tickets.find(t => t.id === ticketId);
        if (found) {
          setSelectedTicket(found);
          // Limpiar el parámetro de la URL
          navigate(location.pathname, { replace: true });
        }
      }
    }
  }, [loading, tickets, location.search]);

  // Filter tickets
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

      const matchesArchived =
        archivedFilter === 'all'
          ? true
          : archivedFilter === 'archived'
            ? t.archived === true
            : (t.archived === false || t.archived === undefined);

      return matchesSearch && matchesPriority && matchesIncidence && matchesArchived;
    });
  }, [tickets, searchTerm, priorityFilter, incidenceTypeFilter, archivedFilter]);

  // Unique incidence types for filter dropdown
  const uniqueIncidenceTypes = useMemo(() => {
    const types = tickets.map(t => t.tipo_incidencia);
    return Array.from(new Set(types));
  }, [tickets]);

  const buildExportRows = () => {
    return filteredTickets.map(t => {
      const numStr = `#${t.ticket_number.toString().padStart(5, '0')}`;
      const customerName = t.cliente ? `${t.cliente.nombre} ${t.cliente.apellido}` : (t.contactName || 'Cliente Externo');
      const companyName = t.cliente ? (t.cliente.company?.nombre || t.cliente.empresa || '-') : (t.contactEmail || '-');
      const priorityLabel = t.priority === 1 ? 'Baja' : t.priority === 2 ? 'Media' : t.priority === 3 ? 'Alta' : 'Sin prioridad';
      const fechaApertura = new Date(t.fecha_apertura).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const responsableLabel = t.responsable ? t.responsable.username : 'Sin asignar';
      const stageName = t.stage ? t.stage.strname : 'N/A';
      
      const enteredDate = t.stage_entered_at ? new Date(t.stage_entered_at) : new Date(t.fecha_apertura);
      const diffTime = Math.max(0, Date.now() - enteredDate.getTime());
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const limitDays = t.stage?.intmaxdays;
      const stageDaysLabel = limitDays ? `${days}d / ${limitDays}d` : `${days}d`;

      return [
        numStr,
        t.strtitle || '',
        customerName,
        companyName,
        t.tipo_incidencia || '',
        priorityLabel,
        fechaApertura,
        responsableLabel,
        stageName,
        stageDaysLabel
      ];
    });
  };

  const EXPORT_HEADERS = [
    'Número',
    'Asunto',
    'Cliente / Contacto',
    'Empresa / Correo',
    'Incidencia',
    'Prioridad',
    'Apertura',
    'Responsable',
    'Etapa',
    'Días en Etapa'
  ];

  const handleExportPDF = () => {
    const rows = buildExportRows();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte de Tickets - Mesa de Ayuda', 40, 40);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, 40, 60);

    autoTable(doc, {
      head: [EXPORT_HEADERS],
      body: rows,
      startY: 75,
      styles: { fontSize: 7, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 255] },
      columnStyles: {
        0: { cellWidth: 45 },  // Número
        1: { cellWidth: 100 }, // Asunto
        2: { cellWidth: 100 }, // Cliente
        3: { cellWidth: 100 }, // Empresa
        4: { cellWidth: 70 },  // Incidencia
        5: { cellWidth: 50 },  // Prioridad
        6: { cellWidth: 80 },  // Apertura
        7: { cellWidth: 70 },  // Responsable
        8: { cellWidth: 60 },  // Etapa
        9: { cellWidth: 60 },  // Días en Etapa
      },
    });

    doc.save(`tickets_${new Date().toISOString().slice(0, 10)}.pdf`);
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
    link.setAttribute('download', `tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Ticket CRUD Handlers
  const handleCreateTicketSubmit = async (ticketPayload: Partial<Ticket>) => {
    setActionLoading(true);
    try {
      await createTicket(ticketPayload);
      setIsCreatingTicket(false);
      showSuccess('Ticket creado con éxito.');
      const tks = await getTickets();
      setTickets(tks);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al crear el ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTicketSubmit = async (ticketPayload: Partial<Ticket>) => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await updateTicket(selectedTicket.id, ticketPayload);
      setSelectedTicket(null);
      showSuccess('Ticket actualizado con éxito.');
      const tks = await getTickets();
      setTickets(tks);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al actualizar el ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketToDeleteParam?: Ticket) => {
    const ticketToDelete = ticketToDeleteParam || selectedTicket;
    if (!ticketToDelete) return;
    
    setNotification({
      show: true,
      type: 'confirmation',
      title: 'Eliminar Ticket',
      message: `¿Estás seguro de que deseas eliminar permanentemente el ticket #${ticketToDelete.ticket_number.toString().padStart(5, '0')}?`,
      onConfirm: async () => {
        hideNotification();
        setActionLoading(true);
        try {
          await deleteTicket(ticketToDelete.id);
          if (selectedTicket?.id === ticketToDelete.id) {
            setSelectedTicket(null);
          }
          showSuccess('Ticket eliminado.');
          const tks = await getTickets();
          setTickets(tks);
        } catch (err: any) {
          showError(err.response?.data?.message || 'Error al eliminar el ticket.');
        } finally {
          setActionLoading(false);
        }
      },
      onCancel: hideNotification
    });
  };

  // Convert Ticket to Opportunity
  const handleConvertToOpportunityClick = (ticket: Ticket) => {
    setSelectedTicket(null);
    setTicketToConvert(ticket);
  };

  const handleConvertToOpportunitySubmit = async (opportunityPayload: any) => {
    setActionLoading(true);
    try {
      await createOpportunity(opportunityPayload);
      
      const resolvedStage = stages.find(s => s.strname === 'Resuelto');
      if (resolvedStage && ticketToConvert) {
        await updateTicket(ticketToConvert.id, {
          stage_id: resolvedStage.id,
          notas_resolucion: 'Convertido en oportunidad comercial.'
        });
      }

      setTicketToConvert(null);
      showSuccess('Oportunidad comercial creada correctamente y ticket resuelto.');
      
      const tks = await getTickets();
      setTickets(tks);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al convertir ticket a oportunidad.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (ticket: Ticket) => {
    const isArchiving = !ticket.archived;
    setNotification({
      show: true,
      type: 'confirmation',
      title: `¿Seguro que deseas ${isArchiving ? 'archivar' : 'desarchivar'} el ticket?`,
      message: isArchiving ? 'El ticket se ocultará de la vista principal.' : 'El ticket volverá a estar visible.',
      onConfirm: async () => {
        hideNotification();
        const originalTickets = [...tickets];
        const updatedTickets = tickets.map(t =>
          t.id === ticket.id ? { ...t, archived: isArchiving } : t
        );
        setTickets(updatedTickets);
        setSelectedTicket(null);

        try {
          await archiveTicket(ticket.id, isArchiving);
          showSuccess(`Ticket ${isArchiving ? 'archivado' : 'desarchivado'} correctamente.`);
        } catch (error) {
          showError(`No se pudo ${isArchiving ? 'archivar' : 'desarchivar'} el ticket.`);
          setTickets(originalTickets);
        }
      },
      onCancel: hideNotification,
    });
  };

  // Drag and drop events handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = tickets.find(t => t.id === active.id);
    if (ticket) {
      setActiveTicket(ticket);
      setActiveStage(null);
    } else {
      const stage = stages.find(s => s.id === active.id);
      if (stage) {
        setActiveStage(stage);
        setActiveTicket(null);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);
    setActiveStage(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // A. ¿Arrastrando una etapa (columna)?
    const isStageDrag = stages.some(s => s.id === activeId);
    if (isStageDrag) {
      if (activeId !== overId) {
        let targetStageId = overId;
        if (!visibleStageIds.includes(overId)) {
          const overTkt = tickets.find(t => t.id === overId);
          if (overTkt) {
            targetStageId = overTkt.stage_id;
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
            await updateMainHelpdesk({
              stages: newStages.map(s => ({
                id: s.id,
                strname: s.strname,
                blnstatus: s.blnstatus,
                display_order: s.display_order,
                strcolor: s.strcolor,
                blninitial: s.blninitial,
                intmaxdays: s.intmaxdays,
                helpdesk_id: s.helpdesk_id,
                dtmcreated: s.dtmcreated,
                dtmlastmodified: s.dtmlastmodified,
              })),
            });
          } catch (error) {
            showError('No se pudo guardar el nuevo orden de las etapas');
            setStages(originalStages);
            setVisibleStageIds(originalVisibleStageIds);
          }
        }
      }
      return;
    }

    // B. Arrastrando un ticket (tarjeta)
    const ticket = tickets.find(t => t.id === activeId);
    if (!ticket) return;

    // Control de arrastre
    const canDrag = isAdmin || (isEjecutivo && ticket.responsable_id === currentUser?.sub);
    if (!canDrag) {
      showError('No tienes permiso para mover este ticket.');
      return;
    }

    const activeStageId = ticket.stage_id;
    let overStageId = stages.find(s => s.id === overId && s.blnstatus)?.id;
    if (!overStageId) {
      overStageId = tickets.find(t => t.id === overId)?.stage_id;
    }

    if (activeStageId && overStageId && activeStageId !== overStageId) {
      const targetStage = stages.find(s => s.id === overStageId);

      // Si es la etapa Resuelto, requerimos notas de resolución mediante modal
      if (targetStage && targetStage.strname === 'Resuelto') {
        setResolutionTicketInfo({ ticketId: activeId, overStageId });
        return;
      }

      const originalTickets = [...tickets];
      const updatedTickets = tickets.map(t =>
        t.id === activeId
          ? {
              ...t,
              stage_id: overStageId!,
              stage_entered_at: new Date().toISOString(),
              stage: targetStage || t.stage,
              fecha_cierre: null,
              notas_resolucion: null,
            }
          : t
      );
      setTickets(updatedTickets);

      try {
        await updateTicket(activeId, {
          stage_id: overStageId,
          notas_resolucion: null
        });
      } catch (error) {
        showError('No se pudo mover el ticket');
        setTickets(originalTickets);
      }
    }
  };

  const handleStageVisibilityChange = (stageId: string) => {
    setVisibleStageIds(prev => {
      if (prev.includes(stageId)) {
        if (prev.length <= 3) return prev;
        return prev.filter(id => id !== stageId);
      }
      return [...prev, stageId];
    });
  };

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage) return;

    const nameTrimmed = editingStage.strname.trim();
    if (!nameTrimmed) {
      showError('El nombre de la etapa no puede estar vacío.');
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
      showError('Debe existir al menos una etapa activa.');
      return;
    }

    const initialActive = activeStages.filter(s => s.blninitial);
    if (initialActive.length !== 1) {
      showError('Debe existir exactamente una etapa inicial activa.');
      return;
    }

    const names = updatedStages.map(s => s.strname.trim().toLowerCase());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      showError('No se permiten nombres duplicados de etapas.');
      return;
    }

    try {
      setLoading(true);
      await updateMainHelpdesk({
        stages: updatedStages.map(s => ({
          id: s.id,
          strname: s.strname.trim(),
          blnstatus: s.blnstatus,
          display_order: s.display_order,
          strcolor: s.strcolor || '#6366f1',
          blninitial: s.blninitial,
          intmaxdays: s.intmaxdays,
          helpdesk_id: s.helpdesk_id,
          dtmcreated: s.dtmcreated,
          dtmlastmodified: s.dtmlastmodified,
        })),
      });
      setEditingStage(null);
      showSuccess('Etapa actualizada correctamente');
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ocurrió un error al actualizar la etapa.';
      showError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableStage = async (stageToDisable: TicketStage) => {
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
      await updateMainHelpdesk({
        stages: updatedStages.map(s => ({
          id: s.id,
          strname: s.strname.trim(),
          blnstatus: s.blnstatus,
          display_order: s.display_order,
          strcolor: s.strcolor || '#6366f1',
          blninitial: s.blninitial,
          intmaxdays: s.intmaxdays,
          helpdesk_id: s.helpdesk_id,
          dtmcreated: s.dtmcreated,
          dtmlastmodified: s.dtmlastmodified,
        })),
      });
      showSuccess(`Etapa "${stageToDisable.strname}" desactivada correctamente`);
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ocurrió un error al desactivar la etapa.';
      showError(Array.isArray(msg) ? msg.join(', ') : msg);
      loadData();
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
      showError('Ya existe una etapa con este nombre.');
      return;
    }

    const daysLimit = newStageMaxDays.trim() === '' ? null : parseInt(newStageMaxDays, 10);
    const nextDisplayOrder = stages.length;
    const newStage: TicketStage = {
      id: `temp-${Date.now()}`,
      strname: nameTrimmed,
      blnstatus: true,
      helpdesk_id: helpdesk?.id || '',
      display_order: nextDisplayOrder,
      strcolor: '#6366f1',
      blninitial: false,
      intmaxdays: daysLimit,
      dtmcreated: new Date().toISOString(),
      dtmlastmodified: new Date().toISOString(),
    };

    const updatedStages = enforceFirstActiveIsInitial([...stages, newStage]);

    try {
      setLoading(true);
      await updateMainHelpdesk({
        stages: updatedStages.map(s => {
          const payloadItem: any = {
            strname: s.strname.trim(),
            blnstatus: s.blnstatus,
            display_order: s.display_order,
            strcolor: s.strcolor || '#6366f1',
            blninitial: s.blninitial,
            intmaxdays: s.intmaxdays,
          };
          if (s.id && !s.id.startsWith('temp-')) {
            payloadItem.id = s.id;
          }
          return payloadItem;
        }),
      });

      showSuccess(`Etapa "${nameTrimmed}" creada correctamente`);
      setNewStageName('');
      setNewStageMaxDays('');
      setIsAddingStage(false);
      await loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ocurrió un error al crear la etapa.';
      showError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionTicketInfo) return;
    if (!resolutionNotesTemp.trim()) {
      showError('Las notas de resolución son obligatorias.');
      return;
    }

    const { ticketId, overStageId } = resolutionTicketInfo;
    const targetStage = stages.find(s => s.id === overStageId);
    const originalTickets = [...tickets];

    const updatedTickets = tickets.map(t =>
      t.id === ticketId
        ? {
            ...t,
            stage_id: overStageId,
            stage_entered_at: new Date().toISOString(),
            stage: targetStage || t.stage,
            notas_resolucion: resolutionNotesTemp.trim(),
            fecha_cierre: new Date().toISOString(),
          }
        : t
    );
    setTickets(updatedTickets);
    setResolutionTicketInfo(null);
    setResolutionNotesTemp('');

    try {
      await updateTicket(ticketId, {
        stage_id: overStageId,
        notas_resolucion: resolutionNotesTemp.trim()
      });
      showSuccess('Ticket resuelto correctamente.');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al actualizar el ticket.');
      setTickets(originalTickets);
    }
  };

  const handleResolutionCancel = () => {
    setResolutionTicketInfo(null);
    setResolutionNotesTemp('');
  };

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];
    if (archivedFilter === 'archived') {
      list.push({
        id: 'archived',
        label: 'Archivados',
        icon: <Filter size={10} />,
        onRemove: () => setArchivedFilter('active')
      });
    }
    if (archivedFilter === 'all') {
      list.push({
        id: 'all',
        label: 'Todos',
        icon: <Filter size={10} />,
        onRemove: () => setArchivedFilter('active')
      });
    }
    if (priorityFilter !== 'all') {
      list.push({
        id: 'priority',
        label: priorityFilter === 0 ? 'Sin prioridad' : priorityFilter === 1 ? 'Baja' : priorityFilter === 2 ? 'Media' : 'Alta',
        icon: <Star size={10} />,
        onRemove: () => setPriorityFilter('all')
      });
    }
    if (incidenceTypeFilter !== 'all') {
      list.push({
        id: 'incidence',
        label: incidenceTypeFilter,
        icon: <Tag size={10} />,
        onRemove: () => setIncidenceTypeFilter('all')
      });
    }
    return list;
  }, [archivedFilter, priorityFilter, incidenceTypeFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Notification {...notification} />

      {/* Header Pipeline-style: título + toolbar en una sola fila */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        {/* Title + collapse toggle (mobile) */}
        <div className="flex justify-between items-start w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <LifeBuoy size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
                {helpdesk?.strname}
              </h1>
              {helpdesk?.strdescription && (
                <p className="text-sm text-indigo-500 font-medium mt-0.5">
                  {helpdesk.strdescription}
                </p>
              )}
            </div>
          </div>
          <button
            className="md:hidden p-2 text-gray-500 hover:text-indigo-600 bg-gray-100 rounded-full transition-colors ml-3"
            onClick={() => setShowToolbar(!showToolbar)}
          >
            {showToolbar ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Toolbar (collapsible on mobile) */}
        <div className={`${showToolbar ? 'flex' : 'hidden'} md:flex flex-col sm:flex-row w-full md:w-auto gap-3 flex-wrap`}>

          <UnifiedSearchBar
            ref={searchDropdownRef}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={priorityFilter === 'all' && incidenceTypeFilter === 'all' ? 'Buscar ticket...' : ''}
            badges={badges}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            dropdownWidthClass="w-[340px]"
            dropdownAlign="left"
          >
            {/* Column 1: Priority + Stages */}
            <div className="flex-1 flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
              <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none">
                <Filter size={11} /> Filtros
              </h4>

              {/* Archived Filter options */}
              <button
                type="button"
                onClick={() => setArchivedFilter(archivedFilter === 'archived' ? 'active' : 'archived')}
                className="flex items-center justify-between text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer font-semibold"
              >
                <span>Tickets Archivados</span>
                {archivedFilter === 'archived' && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => setArchivedFilter(archivedFilter === 'all' ? 'active' : 'all')}
                className="flex items-center justify-between text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer font-semibold"
              >
                <span>Todos los Tickets</span>
                {archivedFilter === 'all' && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
              </button>

              <div className="border-t border-gray-100 my-1 shrink-0" />

              {/* Priority options — star UI */}
              <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider px-2 mt-1 mb-0.5 shrink-0 select-none">Prioridad</h5>
              <div className="flex items-center gap-0.5 px-2 py-1">

                {[1, 2, 3].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPriorityFilter(priorityFilter === star ? 'all' : star)}
                    title={star === 1 ? 'Baja' : star === 2 ? 'Media' : 'Alta'}
                    className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      size={18}
                      className={priorityFilter !== 'all' && typeof priorityFilter === 'number' && priorityFilter > 0 && star <= priorityFilter ? 'text-amber-400 fill-current' : 'text-slate-300 hover:text-amber-300'}
                    />
                  </button>
                ))}
                {priorityFilter !== 'all' && (
                  <span className="text-[10px] text-slate-500 ml-1">
                    {priorityFilter === 0 ? 'Sin prioridad' : priorityFilter === 1 ? 'Baja' : priorityFilter === 2 ? 'Media' : 'Alta'}
                  </span>
                )}
              </div>

              <div className="border-t border-gray-100 my-1 shrink-0" />

              {/* Stages quick filter */}
              <h5 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider px-2 mt-1 mb-0.5 shrink-0 select-none">Etapas</h5>
              {stages.filter(s => s.blnstatus).map(stage => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {/* quick jump — optional: filter by stage */ setShowFilters(false);}}
                  className="flex items-center gap-2 text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.strcolor || '#6366f1' }} />
                  <span className="truncate">{stage.strname}</span>
                </button>
              ))}
            </div>

            {/* Column 2: Incidence types + clear */}
            <div className="flex-1 flex flex-col gap-1 border-l border-gray-100 pl-4 max-h-[300px] overflow-y-auto">
              <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0 select-none">
                <Tag size={11} /> Tipo de Incidencia
              </h4>
              <button
                type="button"
                onClick={() => setIncidenceTypeFilter('all')}
                className="flex items-center justify-between text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer"
              >
                <span>Todos</span>
                {incidenceTypeFilter === 'all' && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
              </button>
              {uniqueIncidenceTypes.filter(Boolean).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIncidenceTypeFilter(incidenceTypeFilter === type ? 'all' : type)}
                  className="flex items-center justify-between text-xs text-gray-700 hover:bg-gray-50 px-2 py-1 rounded w-full text-left transition-colors cursor-pointer"
                >
                  <span className="truncate">{type}</span>
                  {incidenceTypeFilter === type && <span className="text-indigo-600 font-extrabold text-sm">✓</span>}
                </button>
              ))}

              {/* Clear filters */}
              <div className="border-t border-gray-100 my-1 mt-auto shrink-0" />
              <button
                type="button"
                onClick={() => { setPriorityFilter('all'); setIncidenceTypeFilter('all'); setSearchTerm(''); setArchivedFilter('active'); }}
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
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 flex items-center gap-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Vista Kanban"
              >
                <KanbanIcon size={14} />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 flex items-center gap-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Vista Lista"
              >
                <ListIcon size={14} />
                <span>Lista</span>
              </button>
            </div>

            {/* Etapas — next to the toggle */}
            {viewMode === 'kanban' && (
              <StageVisibilitySelector
                stages={stages}
                visibleStageIds={visibleStageIds}
                onVisibilityChange={handleStageVisibilityChange}
                zIndex={50}
                labelSize="xs"
                themeColor="indigo"
                align="responsive"
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setIsCreatingTicket(true)}
              variant="success"
              className="flex-1 sm:flex-none"
            >
              <Plus size={18} className="mr-2" />
              Nuevo Ticket
            </Button>
            {isAdmin && (
              <Button
                title="Configurar Mesa de Ayuda"
                variant="secondary"
                className="shrink-0 !py-2.5 !px-3.5"
                onClick={() => setShowStagesConfig(true)}
              >
                <Settings2 size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      {actionLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader />
        </div>
      ) : (
        /* Tablero de Soporte (Kanban o Lista) */
        <div className="space-y-4">

          {/* Renderizado de Vistas */}
          {viewMode === 'kanban' ? (
            /* Vista Kanban con Drag and Drop */
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className={`flex space-x-4 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 ${!activeTicket && !activeStage ? 'snap-x snap-mandatory' : ''}`}>
                <SortableContext
                  items={stages.filter(s => s.blnstatus && visibleStageIds.includes(s.id)).map(s => s.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {stages
                    .filter(s => s.blnstatus && visibleStageIds.includes(s.id))
                    .map(stage => (
                       <HelpdeskColumn
                        key={stage.id}
                        stage={stage}
                        tickets={filteredTickets.filter(t => t.stage_id === stage.id)}
                        onClickTicket={setSelectedTicket}
                        stages={stages}
                        onEditStage={setEditingStage}
                        onDisableStage={handleDisableStage}
                        onAddTicket={() => {
                          setIsCreatingTicket(true);
                        }}
                        isFolded={foldedStageIds.includes(stage.id)}
                        onFoldStage={stageId => setFoldedStageIds(prev => [...prev, stageId])}
                        onUnfoldStage={stageId => setFoldedStageIds(prev => prev.filter(id => id !== stageId))}
                        onDeleteTicket={handleDeleteTicket}
                        onArchiveTicket={handleArchive}
                      />
                    ))}
                </SortableContext>

                {/* Odoo-style quick stage creator column */}
                {isAdmin && (
                  !isAddingStage ? (
                    <div
                      onClick={() => setIsAddingStage(true)}
                      className="flex flex-col min-h-[500px] w-[45px] sm:w-[50px] flex-shrink-0 snap-center rounded-xl bg-slate-100/50 hover:bg-slate-200/50 border border-dashed border-gray-300 hover:border-slate-400 transition-all duration-200 ease-in-out cursor-pointer items-center justify-start pt-6 shadow-sm select-none"
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
                        <Input
                          label="Nombre"
                          ref={addStageInputRef}
                          type="text"
                          value={newStageName}
                          onChange={e => setNewStageName(e.target.value)}
                          placeholder="Nombre de la etapa..."
                          required
                        />
                        <Input
                          label="Límite de días (opcional)"
                          type="number"
                          min="0"
                          value={newStageMaxDays}
                          onChange={e => setNewStageMaxDays(e.target.value)}
                          placeholder="Ej. 15 (vacío = sin límite)"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            type="submit"
                            variant="indigo"
                            className="flex-1"
                          >
                            Añadir
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              setIsAddingStage(false);
                              setNewStageName('');
                              setNewStageMaxDays('');
                            }}
                            variant="secondary"
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </div>
                  )
                )}
              </div>

              {/* DragOverlay para la previsualización del arrastre */}
              <DragOverlay>
                {activeTicket ? (
                  <TicketCard
                    ticket={activeTicket}
                    onClick={() => {}}
                    isOverlay
                  />
                ) : activeStage ? (
                  <div className="opacity-95 shadow-2xl scale-[1.02] rotate-1 cursor-grabbing">
                    <HelpdeskColumn
                      stage={activeStage}
                      tickets={filteredTickets.filter(t => t.stage_id === activeStage.id)}
                      onClickTicket={() => {}}
                      stages={stages}
                      onEditStage={() => {}}
                      onDisableStage={() => {}}
                      onAddTicket={() => {}}
                      isOverlay
                      isFolded={foldedStageIds.includes(activeStage.id)}
                      onFoldStage={() => {}}
                      onUnfoldStage={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            /* Vista Lista (Tabla) */
            <TicketsListTable
              tickets={filteredTickets}
              onTicketClick={setSelectedTicket}
            />
          )}

        </div>
      )}

      {/* Drawer Lateral: Configurar Mesa de Ayuda */}
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
                <h2 className="text-lg font-bold text-gray-800">Configurar Mesa de Ayuda</h2>
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
              <HelpdeskStagesSettings
                onlyHelpdeskDetails={false}
                onSaveSuccess={() => {
                  loadData();
                  setShowStagesConfig(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Etapa */}
      <Modal open={editingStage !== null} onClose={() => setEditingStage(null)} maxWidth="max-w-md" height="h-auto">
        {editingStage && (
          <form onSubmit={handleSaveStage} className="space-y-6 p-2">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Settings2 size={18} className="text-indigo-600" />
              Editar Etapa: {editingStage.strname || 'Nueva'}
            </h3>

            <div className="space-y-4">
              <Input
                label="Nombre de la Etapa"
                type="text"
                value={editingStage.strname}
                onChange={e => setEditingStage({ ...editingStage, strname: e.target.value })}
                placeholder="Ej. En Espera"
                required
              />
              <Input
                label="Límite de Días"
                type="number"
                min="0"
                value={editingStage.intmaxdays !== undefined && editingStage.intmaxdays !== null ? editingStage.intmaxdays : ''}
                onChange={e => {
                  const val = e.target.value;
                  setEditingStage({ ...editingStage, intmaxdays: val === '' ? null : parseInt(val, 10) });
                }}
                placeholder="Ej. 15 (dejar vacío para sin límite)"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
              <Button
                type="button"
                onClick={() => setEditingStage(null)}
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="indigo"
              >
                Guardar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Notas de Resolución para Drag and Drop */}
      <Modal open={resolutionTicketInfo !== null} onClose={handleResolutionCancel} maxWidth="max-w-md" height="h-auto">
        {resolutionTicketInfo && (
          <form onSubmit={handleResolutionSubmit} className="space-y-4 p-2">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
              <LifeBuoy size={18} className="text-indigo-600" />
              Notas de Resolución
            </h3>
            <div className="flex gap-2 text-rose-800 border border-rose-200 bg-rose-50/40 p-3 rounded-lg text-xs items-center font-medium">
              <AlertTriangle size={15} className="text-rose-600 shrink-0" />
              <span>El ticket pasará a la etapa **Resuelto**. Las notas de resolución son obligatorias para continuar.</span>
            </div>
            <TextArea
              label="Comentarios / Notas"
              value={resolutionNotesTemp}
              onChange={e => setResolutionNotesTemp(e.target.value)}
              placeholder="Describe detalladamente cómo se resolvió la incidencia..."
              className="w-full min-h-[100px]"
              required
            />
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
              <Button
                type="button"
                onClick={handleResolutionCancel}
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="indigo"
              >
                Resolver Ticket
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Detalle del Ticket */}
      <Modal open={selectedTicket !== null} onClose={() => setSelectedTicket(null)} maxWidth="max-w-6xl">
        {selectedTicket && (
          <div className="animate-in fade-in duration-300">
            <div className="border-b border-slate-150 pb-4 mb-6 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                Detalle del Ticket #{selectedTicket.ticket_number.toString().padStart(5, '0')}
              </h2>
            </div>
            <TicketDetail
              ticket={selectedTicket}
              stages={stages}
              onSave={handleUpdateTicketSubmit}
              onCancel={() => setSelectedTicket(null)}
              onDelete={handleDeleteTicket}
              onConvertToOpportunity={handleConvertToOpportunityClick}
              onArchive={handleArchive}
            />
          </div>
        )}
      </Modal>

      {/* Modal: Registrar Nuevo Ticket */}
      <Modal open={isCreatingTicket} onClose={() => setIsCreatingTicket(false)} maxWidth="max-w-6xl">
        {isCreatingTicket && (
          <div className="animate-in fade-in duration-300">
            <div className="border-b border-slate-150 pb-4 mb-6 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                Registrar Nuevo Ticket
              </h2>
            </div>
            <TicketDetail
              stages={stages}
              onSave={handleCreateTicketSubmit}
              onCancel={() => setIsCreatingTicket(false)}
            />
          </div>
        )}
      </Modal>

      {/* Modal: Convertir Ticket a Oportunidad */}
      <Modal open={ticketToConvert !== null} onClose={() => setTicketToConvert(null)} maxWidth="max-w-6xl">
        {ticketToConvert && (
          <div className="animate-in fade-in duration-300">
            <div className="border-b border-slate-150 pb-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                Convertir Ticket a Oportunidad Comercial
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Completa los datos para el Pipeline Comercial. Al guardar, el ticket #{ticketToConvert.ticket_number.toString().padStart(5, '0')} pasará automáticamente a la etapa "Resuelto".
              </p>
            </div>
            <OpportunityForm
              initialData={{
                id: '',
                nombre_proyecto: `Oportunidad: ${ticketToConvert.strtitle}`,
                description: ticketToConvert.description,
                cliente_id: ticketToConvert.cliente_id,
                cliente: ticketToConvert.cliente,
                empresa: ticketToConvert.cliente ? (ticketToConvert.cliente.company?.nombre || ticketToConvert.cliente.empresa || '') : '',
                companyId: ticketToConvert.cliente?.companyId || null,
                priority: ticketToConvert.priority,
                ejecutivo_id: ticketToConvert.responsable_id || '',
                ejecutivo: ticketToConvert.responsable,
                stage_id: commercialStages.find(s => s.blninitial)?.id || '',
                monto_licenciamiento: 0,
                monto_servicios: 0,
                monto_total: 0,
                moneda: 'USD',
                interactions: [],
                reminders: [],
              }}
              onSubmit={handleConvertToOpportunitySubmit}
              onCancel={() => setTicketToConvert(null)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HelpdeskPage;
