import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  getAllOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  archiveOpportunity
} from '../services/opportunitiesService';
import type { Opportunity, Stage } from '../core/models/Opportunity';
import { getActiveStages } from '../services/pipelinesService';
import Modal from '../components/Modal/Modal';
import ConfirmModal from '../components/Modal/ConfirmModal';
import Loader from '../components/Loader/Loader';
import OpportunityForm from '../components/Pipeline/OpportunityForm';
import Tabs from '../components/Tabs/Tabs';
import RemindersTab from '../components/Reminder/RemindersTab';
import InteractionsTab from '../components/Interaction/InteractionsTab';
import { Plus, Filter, XCircle } from 'lucide-react';
import Select from '../components/shared/Select';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';

import { useAuth } from '../hooks/useAuth';
import OpportunityHistoryTable from '../components/Pipeline/OpportunityHistoryTable';
import Notification from '../components/Modal/Notification';
import FilesTab from '../components/Files/FilesTab';
import ActivitiesTab from '../components/Activity/ActivitiesTab';

const PAGE_SIZE = 10;

const OpportunitiesHistoryPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [executiveFilter, setExecutiveFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // Por defecto, en el historial mostramos todo (activos y archivados)
  const [archivedFilter, setArchivedFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const searchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hideNotification = () => setNotification({ ...notification, show: false });


  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const data = await getAllOpportunities();
      setOpportunities(data);
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar el historial de oportunidades',
        onConfirm: hideNotification,
        onCancel: hideNotification,      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const data = await getActiveStages();
      setStages(data);
    } catch (error) {
      console.error('Error al cargar las etapas del pipeline:', error);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchStages();
  }, []);

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
      const { id, cliente, company, contacts, ejecutivo, stage, proposalDocumentPath, files, archived, products, linea_negocio, tipo_entrega, licenciamiento, ...updateData } = opportunity as any; // Corrected line
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

  const handleArchive = async (opportunity: Opportunity) => {
    const isArchiving = !opportunity.archived;
    setNotification({
      show: true,
      type: 'confirmation',
      title: `¿Seguro que deseas ${isArchiving ? 'archivar' : 'desarchivar'} la oportunidad?`,
      message: isArchiving ? 'La oportunidad se ocultará de la vista principal.' : 'La oportunidad volverá a estar visible.',
      onConfirm: async () => {
        hideNotification();
        try {
          await archiveOpportunity(opportunity.id, isArchiving);
          setNotification({
            show: true, type: 'success', title: '¡Éxito!', message: `Oportunidad ${isArchiving ? 'archivada' : 'desarchivada'} correctamente.`, onConfirm: hideNotification, onCancel: hideNotification
          });
          fetchOpportunities();
        } catch (error) {
          setNotification({
            show: true, type: 'error', title: 'Error', message: `No se pudo ${isArchiving ? 'archivar' : 'desarchivar'} la oportunidad.`, onConfirm: hideNotification, onCancel: hideNotification
          });
        }
      },
      onCancel: hideNotification,
    });
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

  const executives = useMemo(() => {
    const execs = new Map<string, { id: string; username: string }>();
    opportunities.forEach(opp => {
      if (opp.ejecutivo && opp.ejecutivo.id && !execs.has(opp.ejecutivo.id)) {
        execs.set(opp.ejecutivo.id, { id: opp.ejecutivo.id, username: opp.ejecutivo.username });
      }
    });
    return Array.from(execs.values());
  }, [opportunities]);

  const executiveOptions = useMemo(() => [
    { value: '', label: 'Todos los Ejecutivos' },
    ...executives.map(exec => ({ value: exec.id, label: exec.username }))
  ], [executives]);

  const stageOptions = useMemo(() => [
    { value: '', label: 'Todas las Etapas' },
    ...stages.map(stage => ({ value: stage.id, label: stage.strname }))
  ], [stages]);

  const archivedOptions = useMemo(() => [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'archived', label: 'Archivados' },
  ], []);

  const filteredOpportunities = useMemo(() =>
    opportunities.filter(opp => {
      const matchesSearch =
        opp.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opp.cliente?.nombre && opp.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (opp.company?.nombre || opp.empresa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opp.ejecutivo?.username && opp.ejecutivo.username.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesExecutive = executiveFilter ? opp.ejecutivo_id === executiveFilter : true;
      const matchesStatus = statusFilter ? opp.stage_id === statusFilter : true;
      const matchesArchived = archivedFilter === 'all'
        ? true
        : archivedFilter === 'archived'
          ? opp.archived === true
          : (opp.archived === false || opp.archived === undefined);

      return matchesSearch && matchesExecutive && matchesStatus && matchesArchived;
    }
    ), [opportunities, searchTerm, executiveFilter, statusFilter, archivedFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredOpportunities.length / PAGE_SIZE);
  const paginatedOpportunities = useMemo(() =>
    filteredOpportunities.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    ), [filteredOpportunities, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Resetear la página a 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, executiveFilter, statusFilter, archivedFilter]);

  const getModalContent = () => {
    if (!editingOpportunity) {
      return (
        <OpportunityForm
          initialData={undefined}
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
        { label: 'Archivos', content: <FilesTab opportunity={editingOpportunity} onUploadSuccess={(updatedOpp) => {
          // Actualizamos el estado local para reflejar el cambio en la UI sin recargar todo
          setEditingOpportunity(updatedOpp);
          setOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o));
        }} /> 
      },
    ];
    return <Tabs tabs={tabs} />;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setExecutiveFilter('');
    setStatusFilter('');
    setArchivedFilter('all');
  };

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];
    if (executiveFilter) {
      list.push({
        id: 'executive',
        label: executives.find(e => e.id === executiveFilter)?.username || 'Ejecutivo',
        icon: <Filter size={10} />,
        onRemove: () => setExecutiveFilter('')
      });
    }
    if (statusFilter) {
      list.push({
        id: 'status',
        label: stages.find(s => s.id === statusFilter)?.strname || 'Etapa',
        icon: <Filter size={10} />,
        onRemove: () => setStatusFilter('')
      });
    }
    if (archivedFilter !== 'all') {
      list.push({
        id: 'archived',
        label: archivedFilter === 'archived' ? 'Archivadas' : 'Activas',
        icon: <Filter size={10} />,
        onRemove: () => setArchivedFilter('all')
      });
    }
    return list;
  }, [executiveFilter, statusFilter, archivedFilter, executives, stages]);

  return (
    <>
      <Notification {...notification} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Historial de Oportunidades</h1>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <UnifiedSearchBar
            ref={searchDropdownRef}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={!executiveFilter && !statusFilter && archivedFilter === 'all' ? "Buscar..." : ""}
            badges={badges}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            dropdownWidthClass="w-[340px]"
          >
            <div className="w-full flex flex-col gap-3">
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Ejecutivo</h4>
                <Select
                  options={executiveOptions}
                  value={executiveOptions.find(opt => opt.value === executiveFilter)}
                  onChange={(selected) => setExecutiveFilter(selected ? selected.value : '')}
                  placeholder="Todos los Ejecutivos"
                  isSearchable
                />
              </div>
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Etapa</h4>
                <Select
                  options={stageOptions}
                  value={stageOptions.find(opt => opt.value === statusFilter)}
                  onChange={(selected) => setStatusFilter(selected ? selected.value : '')}
                  placeholder="Todas las Etapas"
                  isSearchable
                />
              </div>
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Estado</h4>
                <Select
                  options={archivedOptions}
                  value={archivedOptions.find(opt => opt.value === archivedFilter)}
                  onChange={(selected) => setArchivedFilter(selected ? selected.value as any : 'all')}
                  placeholder="Estado"
                />
              </div>
              <div className="border-t border-gray-100 my-1 pt-2 w-full" />
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

          <Button
            variant="success"
            onClick={openCreateModal}
            className="w-full sm:w-auto py-2.5 px-4 h-[38px] flex items-center justify-center whitespace-nowrap"
          >
            <Plus size={18} className="mr-2" /> Nueva Oportunidad
          </Button>
        </div>
      </div>

      {loading ? (
        <Loader />
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
    </>
  );
};

export default OpportunitiesHistoryPage;