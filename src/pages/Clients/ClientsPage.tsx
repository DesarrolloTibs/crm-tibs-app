import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useConfigStore } from '../../store/useConfigStore';

// Componentes Compartidos
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import ConfirmModal from '../../components/shared/ConfirmModal';

// Submódulo de Contactos
import {
  type Client,
  type ContactFormData,
  type ContactFiltersState,
  ContactsStatsBanner,
  ContactsTable,
  ContactModal,
  calculateContactStats,
  filterContacts,
} from './contacts';

// Submódulo de Empresas
import {
  type Company,
  type CompanyFormData,
  type CompanyFiltersState,
  CompaniesStatsBanner,
  CompaniesTable,
  CompanyModal,
  calculateCompanyStats,
  filterCompanies,
} from './companies';

// Navegación de Sub-Pestañas
import { ClientsNavTabs, type ClientsActiveTab } from './components/ClientsNavTabs';

// Servicios de API
import {
  getClients,
  createClient,
  updateClient,
  updateClientStatus,
  clearClientsCache,
} from '../../services/clientsService';

import {
  getCompanies,
  createCompany,
  updateCompany,
  updateCompanyStatus,
  clearCompaniesCache,
} from '../../services/companiesService';

import { getActiveUsers } from '../../services/usersService';

interface ClientsPageProps {
  defaultTab?: ClientsActiveTab;
}

const INITIAL_CONTACT_FILTERS: ContactFiltersState = {
  search: '',
  status: 'all',
  category: 'all',
  ejecutivoId: 'all',
  companyId: 'all',
};

const INITIAL_COMPANY_FILTERS: CompanyFiltersState = {
  search: '',
  status: 'all',
  ejecutivoId: 'all',
};

export const ClientsPage: React.FC<ClientsPageProps> = ({ defaultTab = 'contacts' }) => {
  const { isAdmin } = useAuth();
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as ClientsActiveTab | null;

  // Estado de pestaña activa
  const [activeTab, setActiveTab] = useState<ClientsActiveTab>(() => {
    if (tabParam === 'companies' || tabParam === 'contacts') return tabParam;
    return defaultTab;
  });

  // Sincronizar parámetro de búsqueda de pestaña
  const handleChangeTab = (tab: ClientsActiveTab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Estados de Entidades
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [executives, setExecutives] = useState<{ value: string; label: string }[]>([]);

  // Estados de Carga
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Estados de Filtros
  const [contactFilters, setContactFilters] = useState<ContactFiltersState>(INITIAL_CONTACT_FILTERS);
  const [companyFilters, setCompanyFilters] = useState<CompanyFiltersState>(INITIAL_COMPANY_FILTERS);

  // Estados de Modales
  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [companyModalOpen, setCompanyModalOpen] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Estado de Modal de Confirmación
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

  // Notificación compartida
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const notify = (notif: {
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
  }) => {
    setNotification({
      show: true,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      onConfirm: () => setNotification((prev) => ({ ...prev, show: false })),
    });
  };

  // Guard ref contra dobles peticiones simultáneas
  const isFetchingRef = useRef<boolean>(false);

  // Carga paralela de entidades
  const loadModuleData = useCallback(async (isManual = false) => {
    if (isFetchingRef.current && !isManual) return;
    isFetchingRef.current = true;

    try {
      if (isManual) {
        setLoading(true);
        clearClientsCache();
        clearCompaniesCache();
      }

      const [clientsData, companiesData, usersData] = await Promise.all([
        getClients(isManual),
        getCompanies(isManual),
        getActiveUsers().catch(() => []),
      ]);

      setClients(Array.isArray(clientsData) ? clientsData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);

      if (Array.isArray(usersData)) {
        setExecutives(
          usersData
            .filter((u) => u.id)
            .map((u) => ({
              value: u.id!,
              label: u.username || 'Usuario sin nombre',
            }))
        );
      }
    } catch (err) {
      console.error('Error al cargar datos del módulo de clientes:', err);
      notify({
        type: 'error',
        title: 'Error de Sincronización',
        message: 'No fue posible sincronizar el catálogo de clientes y empresas. Por favor reintenta.',
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadModuleData();
  }, [schemaName, loadModuleData]);

  // Opciones de empresas formateadas para Select
  const companyOptions = useMemo(() => {
    return companies
      .filter((c) => c.id && c.estatus !== false)
      .map((c) => ({
        value: c.id!,
        label: c.nombre,
      }));
  }, [companies]);

  // Métricas y filtrado de Contactos
  const contactStats = useMemo(() => calculateContactStats(clients), [clients]);
  const filteredContacts = useMemo(
    () => filterContacts(clients, contactFilters),
    [clients, contactFilters]
  );

  const handleContactFilterChange = <K extends keyof ContactFiltersState>(
    key: K,
    value: ContactFiltersState[K]
  ) => {
    setContactFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearContactFilters = () => {
    setContactFilters(INITIAL_CONTACT_FILTERS);
  };

  // Métricas y filtrado de Empresas
  const companyStats = useMemo(() => calculateCompanyStats(companies), [companies]);
  const filteredCompanies = useMemo(
    () => filterCompanies(companies, companyFilters),
    [companies, companyFilters]
  );

  const handleCompanyFilterChange = <K extends keyof CompanyFiltersState>(
    key: K,
    value: CompanyFiltersState[K]
  ) => {
    setCompanyFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearCompanyFilters = () => {
    setCompanyFilters(INITIAL_COMPANY_FILTERS);
  };

  // ----------------------------------------------------
  // Operaciones CRUD de Contactos
  // ----------------------------------------------------
  const handleOpenCreateContact = () => {
    setEditingClient(null);
    setContactModalOpen(true);
  };

  const handleOpenEditContact = (client: Client) => {
    setEditingClient(client);
    setContactModalOpen(true);
  };

  const handleSubmitContact = async (formData: ContactFormData) => {
    setSubmitting(true);
    try {
      if (editingClient?.id) {
        await updateClient(editingClient.id, formData as Client);
        notify({
          type: 'success',
          title: 'Contacto Actualizado',
          message: `El contacto '${formData.nombre} ${formData.apellido}' ha sido guardado exitosamente.`,
        });
      } else {
        await createClient(formData as Client);
        notify({
          type: 'success',
          title: 'Contacto Creado',
          message: `El contacto '${formData.nombre} ${formData.apellido}' fue dado de alta correctamente.`,
        });
      }
      setContactModalOpen(false);
      setEditingClient(null);
      await loadModuleData(true);
    } catch (err) {
      console.error('Error al guardar contacto:', err);
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: 'Ocurrió un error al intentar procesar el contacto. Verifica los datos e inténtalo de nuevo.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleContactStatus = (client: Client) => {
    if (!client.id) return;
    const newStatus = client.estatus === false;

    setConfirmConfig({
      open: true,
      title: newStatus ? '¿Activar Contacto?' : '¿Desactivar Contacto?',
      description: newStatus
        ? `¿Deseas habilitar a '${client.nombre} ${client.apellido}' para nuevas actividades y cotizaciones?`
        : `¿Deseas deshabilitar a '${client.nombre} ${client.apellido}'? Ya no aparecerá en selectores de nuevas oportunidades.`,
      onConfirm: async () => {
        try {
          await updateClientStatus(client.id!, newStatus);
          notify({
            type: 'success',
            title: newStatus ? 'Contacto Activado' : 'Contacto Desactivado',
            message: `El estado de '${client.nombre} ${client.apellido}' ha sido actualizado.`,
          });
          await loadModuleData(true);
        } catch (err) {
          console.error('Error al cambiar estado de contacto:', err);
          notify({
            type: 'error',
            title: 'Error de Actualización',
            message: 'No fue posible actualizar el estado del contacto en el servidor.',
          });
        } finally {
          setConfirmConfig((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  // ----------------------------------------------------
  // Operaciones CRUD de Empresas
  // ----------------------------------------------------
  const handleOpenCreateCompany = () => {
    setEditingCompany(null);
    setCompanyModalOpen(true);
  };

  const handleOpenEditCompany = (company: Company) => {
    setEditingCompany(company);
    setCompanyModalOpen(true);
  };

  const handleSubmitCompany = async (formData: CompanyFormData) => {
    setSubmitting(true);
    try {
      if (editingCompany?.id) {
        await updateCompany(editingCompany.id, formData as Company);
        notify({
          type: 'success',
          title: 'Empresa Actualizada',
          message: `La cuenta '${formData.nombre}' ha sido modificada correctamente.`,
        });
      } else {
        await createCompany(formData as Company);
        notify({
          type: 'success',
          title: 'Empresa Creada',
          message: `La cuenta corporativa '${formData.nombre}' fue dada de alta con éxito.`,
        });
      }
      setCompanyModalOpen(false);
      setEditingCompany(null);
      await loadModuleData(true);
    } catch (err) {
      console.error('Error al guardar empresa:', err);
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: 'No fue posible registrar la empresa. Por favor valida la información ingresada.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCompanyStatus = (company: Company) => {
    if (!company.id) return;
    const newStatus = company.estatus === false;

    setConfirmConfig({
      open: true,
      title: newStatus ? '¿Reactivar Cuenta de Empresa?' : '¿Suspender Empresa?',
      description: newStatus
        ? `¿Deseas volver a habilitar a '${company.nombre}' para la emisión de contratos y prospectos?`
        : `¿Deseas suspender la cuenta '${company.nombre}'? Sus contactos y cotizaciones quedarán temporalmente bloqueados.`,
      onConfirm: async () => {
        try {
          await updateCompanyStatus(company.id!, newStatus);
          notify({
            type: 'success',
            title: newStatus ? 'Empresa Reactivada' : 'Empresa Suspendida',
            message: `El estado de la cuenta '${company.nombre}' ha sido actualizado exitosamente.`,
          });
          await loadModuleData(true);
        } catch (err) {
          console.error('Error al cambiar estado de empresa:', err);
          notify({
            type: 'error',
            title: 'Error de Actualización',
            message: 'No se pudo cambiar el estado de la empresa en el servidor.',
          });
        } finally {
          setConfirmConfig((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  return (
    <>
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={() => setNotification((prev) => ({ ...prev, show: false }))}
      />

      <ConfirmModal
        open={confirmConfig.open}
        message={confirmConfig.description}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, open: false }))}
        confirmLabel="Confirmar"
        cancelLabel="Volver"
        variant="warning"
      />

      {/* Contenedor Principal */}
      <div className="space-y-6">
        {/* Cabecera Principal del Módulo con Selector de Sub-Pestaña y Refresco */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                Directorio Comercial
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Gestión unificada de contactos, prospectos calificados y cuentas corporativas B2B.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Navegación por Pestañas */}
            <ClientsNavTabs
              activeTab={activeTab}
              onChangeTab={handleChangeTab}
              contactsCount={clients.length}
              companiesCount={companies.length}
            />

            {/* Botón de Refresco Manual */}
            <Button
              variant="secondary"
              onClick={() => loadModuleData(true)}
              disabled={loading}
              className="gap-2 !py-2 !px-3 text-xs"
              title="Sincronizar datos"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
              <span className="hidden md:inline">Actualizar</span>
            </Button>
          </div>
        </div>

        {/* Renderizado Condicional del Submódulo Activo */}
        {activeTab === 'contacts' ? (
          <div className="space-y-4">
            <ContactsStatsBanner stats={contactStats} />
            <ContactsTable
              clients={filteredContacts}
              totalCount={clients.length}
              loading={loading}
              isAdmin={isAdmin}
              filters={contactFilters}
              onFilterChange={handleContactFilterChange}
              onClearFilters={handleClearContactFilters}
              onEdit={handleOpenEditContact}
              onToggleStatus={handleToggleContactStatus}
              onCreateNew={handleOpenCreateContact}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <CompaniesStatsBanner stats={companyStats} />
            <CompaniesTable
              companies={filteredCompanies}
              totalCount={companies.length}
              loading={loading}
              isAdmin={isAdmin}
              filters={companyFilters}
              onFilterChange={handleCompanyFilterChange}
              onClearFilters={handleClearCompanyFilters}
              onEdit={handleOpenEditCompany}
              onToggleStatus={handleToggleCompanyStatus}
              onCreateNew={handleOpenCreateCompany}
            />
          </div>
        )}
      </div>

      {/* Modal de Contactos */}
      {contactModalOpen && (
        <ContactModal
          open={contactModalOpen}
          editingClient={editingClient}
          executives={executives}
          companies={companyOptions}
          onClose={() => {
            setContactModalOpen(false);
            setEditingClient(null);
          }}
          onSubmit={handleSubmitContact}
          submitting={submitting}
        />
      )}

      {/* Modal de Empresas */}
      {companyModalOpen && (
        <CompanyModal
          open={companyModalOpen}
          editingCompany={editingCompany}
          executives={executives}
          onClose={() => {
            setCompanyModalOpen(false);
            setEditingCompany(null);
          }}
          onSubmit={handleSubmitCompany}
          submitting={submitting}
        />
      )}
    </>
  );
};

export default ClientsPage;
