import React, { useEffect, useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  getAllOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  archiveOpportunity
} from '../services/opportunitiesService';
import type { Opportunity, OpportunityStageType } from '../core/models/Opportunity';
import { OpportunityStage } from '../core/models/Opportunity';
import Modal from '../components/Modal/Modal';
import ConfirmModal from '../components/Modal/ConfirmModal';
import Loader from '../components/Loader/Loader';
import OpportunityForm from '../components/Pipeline/OpportunityForm';
import Tabs from '../components/Tabs/Tabs';
import RemindersTab from '../components/Reminder/RemindersTab';
import InteractionsTab from '../components/Interaction/InteractionsTab';
import { Plus, Search, Filter, XCircle, User, Tag, Archive } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import OpportunityHistoryTable from '../components/Pipeline/OpportunityHistoryTable';
import ProposalTab from '../components/Proposal/ProposalTab';

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
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const data = await getAllOpportunities();
      setOpportunities(data);
    } catch (error) {
      Swal.fire('Error', 'No se pudo cargar el historial de oportunidades', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleCreate = async (opportunity: Partial<Opportunity>) => {
    try {
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
      const { id, cliente, ejecutivo, proposalDocumentPath, archived, ...updateData } = opportunity as any; // Corrected line
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

  const handleArchive = async (opportunity: Opportunity) => {
    const isArchiving = !opportunity.archived;
    const result = await Swal.fire({
      title: `¿Seguro que deseas ${isArchiving ? 'archivar' : 'desarchivar'} la oportunidad?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${isArchiving ? 'archivar' : 'desarchivar'}`,
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await archiveOpportunity(opportunity.id, isArchiving);
        Swal.fire('¡Éxito!', `Oportunidad ${isArchiving ? 'archivada' : 'desarchivada'} correctamente.`, 'success');
        fetchOpportunities();
      } catch (error) {
        Swal.fire('Error', `No se pudo ${isArchiving ? 'archivar' : 'desarchivar'} la oportunidad.`, 'error');
      }
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

  const executives = useMemo(() => {
    const execs = new Map<string, { id: string; username: string }>();
    opportunities.forEach(opp => {
      if (opp.ejecutivo && opp.ejecutivo.id && !execs.has(opp.ejecutivo.id)) {
        execs.set(opp.ejecutivo.id, { id: opp.ejecutivo.id, username: opp.ejecutivo.username });
      }
    });
    return Array.from(execs.values());
  }, [opportunities]);

  const STAGES = Object.values(OpportunityStage);

  const filteredOpportunities = useMemo(() =>
    opportunities.filter(opp => {
      const matchesSearch =
        opp.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opp.cliente?.nombre && opp.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        opp.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opp.ejecutivo?.username && opp.ejecutivo.username.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesExecutive = executiveFilter ? opp.ejecutivo_id === executiveFilter : true;
      const matchesStatus = statusFilter ? opp.etapa === statusFilter : true;
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
      { label: 'Datos de Oportunidad', content: <OpportunityForm initialData={editingOpportunity} onSubmit={handleUpdate} onCancel={() => setIsFormModalOpen(false)} /> },
      
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setExecutiveFilter('');
    setStatusFilter('');
    setArchivedFilter('all');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historial de Oportunidades</h1>
        <div className="flex items-center space-x-4">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="">Todas las Etapas</option>
                {STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <Archive size={20} />
              </span>
              <select
                value={archivedFilter}
                onChange={e => setArchivedFilter(e.target.value as any)}
                className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="archived">Archivados</option>
              </select>
            </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
              <Search size={20} />
            </span>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          </div>
        </div>
      )}

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

      <Modal open={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
        {getModalContent()}
      </Modal>
    </>
  );
};

export default OpportunitiesHistoryPage;