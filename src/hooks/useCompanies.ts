import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCompanies, createCompany, updateCompany, updateCompanyStatus } from '../services/companiesService';
import { getActiveUsers } from '../services/usersService';
import type { Company } from '../core/models/Company';
import { useConfigStore } from '../store/useConfigStore';
import useDebounce from './useDebounce';
import useNotification from './useNotification';
import type { CompanyFiltersState } from '../components/Company/CompanyFiltersBar';

const INITIAL_FILTERS: CompanyFiltersState = {
  nombre: '',
  correo: '',
  ejecutivoId: null,
};

export function useCompanies() {
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;

  const [rawCompanies, setRawCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [executives, setExecutives] = useState<{ value: string; label: string }[]>([]);

  // Grouped filters state
  const [filters, setFilters] = useState<CompanyFiltersState>(INITIAL_FILTERS);

  // Reusable notification hook
  const { notification, showSuccess, showError, showConfirmation } = useNotification();

  // Debounced text inputs for smooth typing
  const debouncedNombre = useDebounce(filters.nombre, 250);
  const debouncedCorreo = useDebounce(filters.correo, 250);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompanies();
      setRawCompanies(data);
    } catch {
      showError('No se pudieron cargar las empresas');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchCompanies();
    getActiveUsers()
      .then((users) =>
        setExecutives(users.filter((u) => u.id).map((u) => ({ value: u.id!, label: u.username })))
      )
      .catch(console.error);
  }, [fetchCompanies, schemaName]);

  const handleCreate = async (company: Company) => {
    setLoading(true);
    try {
      const d: Company = { ...company };
      delete d.ejecutivo;
      delete d.contacts;
      await createCompany(d);
      setModalOpen(false);
      showSuccess('Empresa creada correctamente');
      fetchCompanies();
    } catch {
      showError('No se pudo crear la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (company: Company) => {
    if (!company.id) return;
    setLoading(true);
    try {
      const d: Company = { ...company };
      delete d.ejecutivo;
      delete d.contacts;
      await updateCompany(company.id, d);
      setEditing(null);
      setModalOpen(false);
      showSuccess('Empresa actualizada correctamente');
      fetchCompanies();
    } catch {
      showError('No se pudo actualizar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (company: Company) => {
    if (!company.id) return;
    const isActivating = !company.estatus;
    showConfirmation({
      title: `¿Deseas ${isActivating ? 'reactivar' : 'desactivar'} esta empresa?`,
      message: isActivating
        ? 'La empresa volverá a estar activa.'
        : 'La empresa se marcará como inactiva.',
      onConfirm: async () => {
        try {
          await updateCompanyStatus(company.id!, isActivating);
          showSuccess(`Empresa ${isActivating ? 'reactivada' : 'desactivada'} correctamente.`);
          fetchCompanies();
        } catch {
          showError('No se pudo cambiar el estado de la empresa.');
        }
      },
    });
  };

  const openCreateModal = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (company: Company) => {
    setEditing(company);
    setModalOpen(true);
  };

  const handleFilterChange = <K extends keyof CompanyFiltersState>(
    key: K,
    value: CompanyFiltersState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Filtered companies memoized with debounce
  const filteredCompanies = useMemo(() => {
    const qNombre = debouncedNombre.trim().toLowerCase();
    const qCorreo = debouncedCorreo.trim().toLowerCase();

    return rawCompanies.filter((c) => {
      if (qNombre && !c.nombre.toLowerCase().includes(qNombre)) {
        return false;
      }
      if (qCorreo && !(c.correo || '').toLowerCase().includes(qCorreo)) {
        return false;
      }
      if (filters.ejecutivoId && c.ejecutivo_id !== filters.ejecutivoId) {
        return false;
      }
      return true;
    });
  }, [rawCompanies, debouncedNombre, debouncedCorreo, filters.ejecutivoId]);

  return {
    companies: filteredCompanies,
    loading,
    editing,
    modalOpen,
    setModalOpen,
    notification,
    executives,
    filters,
    handleFilterChange,
    handleClearFilters,
    handleCreate,
    handleUpdate,
    handleUpdateStatus,
    openCreateModal,
    openEditModal,
  };
}

export default useCompanies;
