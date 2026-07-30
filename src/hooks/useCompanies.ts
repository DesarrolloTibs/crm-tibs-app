import { useState, useEffect, useCallback } from 'react';
import { getCompanies, createCompany, updateCompany, updateCompanyStatus } from '../services/companiesService';
import { getActiveUsers } from '../services/usersService';
import type { Company } from '../core/models/Company';
import { useConfigStore } from '../store/useConfigStore';

const PAGE_SIZE = 10;

export function useCompanies() {
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterNombre, setFilterNombre] = useState('');
  const [filterCorreo, setFilterCorreo] = useState('');
  const [filterEjecutivoId, setFilterEjecutivoId] = useState<string | null>(null);
  const [executives, setExecutives] = useState<{ value: string; label: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = useCallback(
    () => setNotification((prev) => ({ ...prev, show: false })),
    []
  );

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudieron cargar las empresas', onConfirm: hideNotification, onCancel: hideNotification });
    } finally {
      setLoading(false);
    }
  }, [hideNotification]);

  useEffect(() => {
    fetchCompanies();
    getActiveUsers()
      .then((users) =>
        setExecutives(users.filter((u) => u.id).map((u) => ({ value: u.id!, label: u.username })))
      )
      .catch(console.error);
  }, [fetchCompanies, schemaName]);

  useEffect(() => { setCurrentPage(1); }, [filterNombre, filterCorreo, filterEjecutivoId]);

  const handleCreate = async (company: Company) => {
    setLoading(true);
    try {
      const { ejecutivo, contacts, ...companyData } = company as any;
      await createCompany(companyData);
      setModalOpen(false);
      setNotification({ show: true, type: 'success', title: '¡Éxito!', message: 'Empresa creada correctamente', onConfirm: hideNotification, onCancel: hideNotification });
      fetchCompanies();
    } catch {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudo crear la empresa', onConfirm: hideNotification, onCancel: hideNotification });
    } finally { setLoading(false); }
  };

  const handleUpdate = async (company: Company) => {
    if (!company.id) return;
    setLoading(true);
    try {
      const { id, ejecutivo, contacts, ...updateData } = company as any;
      await updateCompany(id, updateData);
      setEditing(null);
      setModalOpen(false);
      setNotification({ show: true, type: 'success', title: '¡Éxito!', message: 'Empresa actualizada correctamente', onConfirm: hideNotification, onCancel: hideNotification });
      fetchCompanies();
    } catch {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudo actualizar la empresa', onConfirm: hideNotification, onCancel: hideNotification });
    } finally { setLoading(false); }
  };

  const handleUpdateStatus = async (company: Company) => {
    if (!company.id) return;
    const companyId = company.id;
    const isActivating = !company.estatus;
    setNotification({
      show: true,
      type: 'confirmation',
      title: `¿Deseas ${isActivating ? 'reactivar' : 'desactivar'} esta empresa?`,
      message: isActivating ? 'La empresa volverá a estar activa.' : 'La empresa se marcará como inactiva.',
      onConfirm: async () => {
        hideNotification();
        try {
          await updateCompanyStatus(companyId, isActivating);
          setNotification({ show: true, type: 'success', title: '¡Éxito!', message: `Empresa ${isActivating ? 'reactivada' : 'desactivada'} correctamente.`, onConfirm: hideNotification, onCancel: hideNotification });
          fetchCompanies();
        } catch {
          setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudo cambiar el estado.', onConfirm: hideNotification, onCancel: hideNotification });
        }
      },
      onCancel: hideNotification,
    });
  };

  const openCreateModal = () => { setEditing(null); setModalOpen(true); };
  const openEditModal = (company: Company) => { setEditing(company); setModalOpen(true); };
  const clearFilters = () => { setFilterNombre(''); setFilterCorreo(''); setFilterEjecutivoId(null); };

  const filteredCompanies = companies.filter((c) =>
    c.nombre.toLowerCase().includes(filterNombre.toLowerCase()) &&
    (c.correo || '').toLowerCase().includes(filterCorreo.toLowerCase()) &&
    (!filterEjecutivoId || c.ejecutivo_id === filterEjecutivoId)
  );

  const totalPages = Math.ceil(filteredCompanies.length / PAGE_SIZE);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return {
    companies: paginatedCompanies,
    loading,
    editing,
    modalOpen,
    setModalOpen,
    showFilters,
    setShowFilters,
    filterNombre,
    setFilterNombre,
    filterCorreo,
    setFilterCorreo,
    filterEjecutivoId,
    setFilterEjecutivoId,
    executives,
    currentPage,
    setCurrentPage,
    totalPages,
    notification,
    hideNotification,
    handleCreate,
    handleUpdate,
    handleUpdateStatus,
    openCreateModal,
    openEditModal,
    clearFilters,
  };
}
