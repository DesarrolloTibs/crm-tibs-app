import { useState, useEffect, useMemo, useCallback } from 'react';
import { getClients, createClient, updateClient, updateClientStatus } from '../services/clientsService';
import { getCompanies, createCompany, updateCompany, updateCompanyStatus } from '../services/companiesService';
import { getActiveUsers } from '../services/usersService';
import { type Client } from '../core/models/Client';
import type { Company } from '../core/models/Company';
import { useConfigStore } from '../store/useConfigStore';
import useDebounce from './useDebounce';
import useNotification from './useNotification';
import type { ClientFiltersState } from '../components/Client/ClientFiltersBar';

const INITIAL_FILTERS: ClientFiltersState = {
  nombre: '',
  empresa: '',
  correo: '',
  ejecutivoId: null,
  category: null,
};

export function useClients() {
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;

  // Sub-module view
  const [viewSubModule, setViewSubModule] = useState<'contacts' | 'companies'>('contacts');

  // Server entities
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [executives, setExecutives] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);

  // Filters state (grouped)
  const [filters, setFilters] = useState<ClientFiltersState>(INITIAL_FILTERS);

  // Notifications
  const { notification, showSuccess, showError, showConfirmation } = useNotification();

  // Debounced text filters for smooth typing and optimized re-renders
  const debouncedNombre = useDebounce(filters.nombre, 250);
  const debouncedEmpresa = useDebounce(filters.empresa, 250);
  const debouncedCorreo = useDebounce(filters.correo, 250);

  // Loaders
  const loadClientsData = useCallback(async () => {
    try {
      const cd = await getClients();
      setClients(cd);
    } catch {
      showError('No se pudieron cargar los contactos');
    }
  }, [showError]);

  const loadCompaniesData = useCallback(async () => {
    try {
      const cod = await getCompanies();
      setCompanies(cod);
    } catch {
      showError('No se pudieron cargar las empresas');
    }
  }, [showError]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadClientsData(), loadCompaniesData()]);
    } finally {
      setLoading(false);
    }
  }, [loadClientsData, loadCompaniesData]);

  useEffect(() => {
    loadAllData();
    getActiveUsers()
      .then((users) =>
        setExecutives(users.filter((u) => u.id).map((u) => ({ value: u.id!, label: u.username })))
      )
      .catch(console.error);
  }, [schemaName, loadAllData]);

  // Client CRUD
  const handleCreateClient = async (client: Client) => {
    setLoading(true);
    try {
      const d: Client = { ...client };
      delete d.ejecutivo;
      delete d.company;
      await createClient(d);
      setClientModalOpen(false);
      showSuccess('Contacto creado correctamente');
      loadClientsData();
    } catch {
      showError('No se pudo crear el contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (client: Client) => {
    if (!client.id) return;
    setLoading(true);
    try {
      const d: Client = { ...client };
      delete d.ejecutivo;
      delete d.company;
      await updateClient(client.id, d);
      setEditingClient(null);
      setClientModalOpen(false);
      showSuccess('Contacto actualizado correctamente');
      loadClientsData();
    } catch {
      showError('No se pudo actualizar el contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClientStatus = async (client: Client) => {
    if (!client.id) return;
    const isActivating = !client.estatus;
    showConfirmation({
      title: `¿${isActivating ? 'Reactivar' : 'Desactivar'} este contacto?`,
      message: isActivating
        ? 'El contacto volverá a estar activo.'
        : 'El contacto se marcará como inactivo.',
      onConfirm: async () => {
        try {
          await updateClientStatus(client.id!, isActivating);
          showSuccess(`Contacto ${isActivating ? 'reactivado' : 'desactivado'} correctamente.`);
          loadClientsData();
        } catch {
          showError(`No se pudo ${isActivating ? 'reactivar' : 'desactivar'} el contacto.`);
        }
      },
    });
  };

  // Company CRUD
  const handleCreateCompany = async (company: Company) => {
    setLoading(true);
    try {
      const d: Company = { ...company };
      delete d.ejecutivo;
      delete d.contacts;
      await createCompany(d);
      setCompanyModalOpen(false);
      showSuccess('Empresa creada correctamente');
      loadCompaniesData();
    } catch {
      showError('No se pudo crear la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async (company: Company) => {
    if (!company.id) return;
    setLoading(true);
    try {
      const d: Company = { ...company };
      delete d.ejecutivo;
      delete d.contacts;
      await updateCompany(company.id, d);
      setEditingCompany(null);
      setCompanyModalOpen(false);
      showSuccess('Empresa actualizada correctamente');
      loadCompaniesData();
    } catch {
      showError('No se pudo actualizar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompanyStatus = async (company: Company) => {
    if (!company.id) return;
    const isActivating = !company.estatus;
    showConfirmation({
      title: `¿${isActivating ? 'Reactivar' : 'Desactivar'} esta empresa?`,
      message: isActivating
        ? 'La empresa volverá a estar activa.'
        : 'La empresa se marcará como inactiva.',
      onConfirm: async () => {
        try {
          await updateCompanyStatus(company.id!, isActivating);
          showSuccess(`Empresa ${isActivating ? 'reactivada' : 'desactivada'} correctamente.`);
          loadCompaniesData();
        } catch {
          showError(`No se pudo ${isActivating ? 'reactivar' : 'desactivar'} la empresa.`);
        }
      },
    });
  };

  // Modal openers
  const openCreateModal = () => {
    if (viewSubModule === 'contacts') {
      setEditingClient(null);
      setClientModalOpen(true);
    } else {
      setEditingCompany(null);
      setCompanyModalOpen(true);
    }
  };

  const openEditClientModal = (c: Client) => {
    setEditingClient(c);
    setClientModalOpen(true);
  };

  const openEditCompanyModal = (c: Company) => {
    setEditingCompany(c);
    setCompanyModalOpen(true);
  };

  // Filter actions
  const handleFilterChange = <K extends keyof ClientFiltersState>(
    key: K,
    value: ClientFiltersState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Optimized in-memory filtering (runs only when data or debounced values change)
  const filteredClients = useMemo(() => {
    const qNombre = debouncedNombre.trim().toLowerCase();
    const qEmpresa = debouncedEmpresa.trim().toLowerCase();
    const qCorreo = debouncedCorreo.trim().toLowerCase();

    return clients.filter((c) => {
      if (qNombre && !`${c.nombre} ${c.apellido}`.toLowerCase().includes(qNombre)) {
        return false;
      }
      if (qEmpresa) {
        const emp = (c.company?.nombre || c.empresa || '').toLowerCase();
        if (!emp.includes(qEmpresa)) return false;
      }
      if (qCorreo && !(c.correo || '').toLowerCase().includes(qCorreo)) {
        return false;
      }
      if (filters.ejecutivoId && c.ejecutivo_id !== filters.ejecutivoId) {
        return false;
      }
      if (filters.category && c.category !== filters.category) {
        return false;
      }
      return true;
    });
  }, [
    clients,
    debouncedNombre,
    debouncedEmpresa,
    debouncedCorreo,
    filters.ejecutivoId,
    filters.category,
  ]);

  const filteredCompanies = useMemo(() => {
    const qNombre = debouncedNombre.trim().toLowerCase();
    const qCorreo = debouncedCorreo.trim().toLowerCase();

    return companies.filter((c) => {
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
  }, [companies, debouncedNombre, debouncedCorreo, filters.ejecutivoId]);

  return {
    viewSubModule,
    setViewSubModule,
    clients,
    companies,
    filteredClients,
    filteredCompanies,
    loading,
    notification,
    executives,
    filters,
    handleFilterChange,
    handleClearFilters,
    // Modals
    editingClient,
    editingCompany,
    clientModalOpen,
    setClientModalOpen,
    companyModalOpen,
    setCompanyModalOpen,
    openCreateModal,
    openEditClientModal,
    openEditCompanyModal,
    // Handlers
    handleCreateClient,
    handleUpdateClient,
    handleUpdateClientStatus,
    handleCreateCompany,
    handleUpdateCompany,
    handleUpdateCompanyStatus,
  };
}

export default useClients;
