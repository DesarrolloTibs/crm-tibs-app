import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Database, Plus, RefreshCw } from 'lucide-react';

// Componentes Compartidos del Sistema
import SettingsContainer from '@shared/components/SettingsContainer';
import Button from '@shared/components/Button';
import ConfirmModal from '@shared/components/ConfirmModal';
import Notification from '@shared/components/Notification';

// Subcomponentes Modulares de Valores de Catálogos
import { CatalogSubTabsNav } from './components/CatalogSubTabsNav';
import { OpportunityCatalogsStatsBanner } from './components/OpportunityCatalogsStatsBanner';
import { OpportunityCatalogsTable } from './components/OpportunityCatalogsTable';
import { CatalogOptionModal } from './components/CatalogOptionModal';
import { RelatedOpportunitiesModal } from './components/RelatedOpportunitiesModal';

// Esquemas y Tipos
import type {
  CatalogType,
  OpportunityCatalogOption,
  CatalogOptionFormData,
  CatalogOptionFilterState,
  NotificationState,
} from './schemas/opportunityCatalogs.schema';

// Utilidades y Helpers
import {
  CATALOG_SUBTABS,
  filterCatalogOptions,
  calculateCatalogStats,
} from './utils/opportunityCatalogs.helpers';

// Servicios API
import {
  getCatalogOptions,
  createCatalogOption,
  updateCatalogOption,
  deleteCatalogOption,
} from '@core/services/opportunityCatalogsService';
import { getOpportunityLabels } from '@core/services/opportunityLabelsService';
import type { OpportunityLabel } from '@core/models/OpportunityLabel';

interface OpportunityCatalogsPageProps {
  activeSubTab?: CatalogType;
  onSubTabChange?: (subTab: CatalogType) => void;
  getLabelName?: (key: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento', defaultName: string) => string;
}

export const OpportunityCatalogsPage: React.FC<OpportunityCatalogsPageProps> = ({
  activeSubTab: externalSubTab,
  onSubTabChange: externalOnSubTabChange,
  getLabelName: externalGetLabelName,
}) => {
  // Estado interno para sub-pestaña si no es provista por props
  const [internalSubTab, setInternalSubTab] = useState<CatalogType>(() => {
    return (sessionStorage.getItem('settingsActiveCatalogSubTab') as CatalogType) || 'business-lines';
  });

  const activeSubTab = externalSubTab || internalSubTab;

  const handleSubTabChange = (tab: CatalogType) => {
    if (externalOnSubTabChange) {
      externalOnSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
      sessionStorage.setItem('settingsActiveCatalogSubTab', tab);
    }
  };

  // Estado interno para etiquetas de catálogos si no se provee getLabelName
  const [internalLabels, setInternalLabels] = useState<OpportunityLabel[]>([]);

  useEffect(() => {
    if (!externalGetLabelName) {
      getOpportunityLabels()
        .then(setInternalLabels)
        .catch((err) => console.error('Error al cargar etiquetas internas en OpportunityCatalogsPage:', err));
    }
  }, [externalGetLabelName]);

  const getLabelName = useCallback(
    (key: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento', defaultName: string) => {
      if (externalGetLabelName) {
        return externalGetLabelName(key, defaultName);
      }
      const label = internalLabels.find((l) => l.field_key === key);
      return label?.strname || defaultName;
    },
    [externalGetLabelName, internalLabels]
  );

  // Obtener la definición activa del catálogo
  const activeTabDef = useMemo(() => {
    return (
      CATALOG_SUBTABS.find((t) => t.id === activeSubTab) || CATALOG_SUBTABS[0]
    );
  }, [activeSubTab]);

  const currentCatalogTitle = getLabelName(activeTabDef.field_key, activeTabDef.defaultName);

  // Estados de datos
  const [options, setOptions] = useState<OpportunityCatalogOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filtros y Búsqueda
  const [filters, setFilters] = useState<CatalogOptionFilterState>({
    search: '',
    status: 'all',
    usage: 'all',
  });

  // Limpiar filtros al cambiar de pestaña
  useEffect(() => {
    setFilters({
      search: '',
      status: 'all',
      usage: 'all',
    });
  }, [activeSubTab]);

  // Estados de Modales
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingOption, setEditingOption] = useState<OpportunityCatalogOption | null>(null);
  const [deletingOption, setDeletingOption] = useState<OpportunityCatalogOption | null>(null);
  const [viewingOpportunitiesOption, setViewingOpportunitiesOption] = useState<OpportunityCatalogOption | null>(null);

  // Notificación compartida
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  const notify = (notif: {
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
    onConfirm?: () => void;
  }) => {
    setNotification({
      show: true,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      onConfirm: notif.onConfirm || hideNotification,
      onCancel: hideNotification,
    });
  };

  // Guard ref para evitar peticiones duplicadas simultáneas o por cambio de título
  const isFetchingRef = useRef<string | null>(null);
  const currentCatalogTitleRef = useRef(currentCatalogTitle);
  useEffect(() => {
    currentCatalogTitleRef.current = currentCatalogTitle;
  }, [currentCatalogTitle]);

  // Cargar opciones desde la API
  const fetchOptions = useCallback(
    async (showLoading = true, isManual = false) => {
      if (isFetchingRef.current === activeSubTab && !isManual) return;
      isFetchingRef.current = activeSubTab;

      try {
        if (showLoading) setLoading(true);
        const data = await getCatalogOptions(activeSubTab);
        setOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(`Error al cargar opciones del catálogo ${activeSubTab}:`, err);
        notify({
          type: 'error',
          title: 'Error de Carga',
          message: `No fue posible obtener los valores del catálogo "${currentCatalogTitleRef.current}". Por favor, reintenta.`,
        });
      } finally {
        setLoading(false);
        isFetchingRef.current = null;
      }
    },
    [activeSubTab]
  );

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Manejo de creación y edición
  const handleOpenCreate = () => {
    setEditingOption(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (option: OpportunityCatalogOption) => {
    setEditingOption(option);
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData: CatalogOptionFormData) => {
    setSubmitting(true);
    try {
      if (editingOption?.id) {
        await updateCatalogOption(
          activeSubTab,
          editingOption.id,
          formData.strname,
          formData.blnstatus
        );
        notify({
          type: 'success',
          title: '¡Opción Actualizada!',
          message: `La opción "${formData.strname}" se ha modificado exitosamente en ${currentCatalogTitle}.`,
        });
      } else {
        await createCatalogOption(activeSubTab, formData.strname);
        notify({
          type: 'success',
          title: '¡Opción Registrada!',
          message: `La nueva opción "${formData.strname}" fue agregada exitosamente a ${currentCatalogTitle}.`,
        });
      }

      setModalOpen(false);
      setEditingOption(null);
      await fetchOptions();
    } catch (err: any) {
      console.error('Error al guardar opción de catálogo:', err);
      const errorMsg =
        err.response?.data?.message ||
        'Ocurrió un error inesperado al procesar la solicitud.';
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Cambio rápido de estado (Activo / Inactivo) desde la tabla
  const handleToggleStatus = async (option: OpportunityCatalogOption) => {
    try {
      const nextStatus = !option.blnstatus;
      // Actualización optimista en interfaz
      setOptions((prev) =>
        prev.map((item) => (item.id === option.id ? { ...item, blnstatus: nextStatus } : item))
      );

      await updateCatalogOption(activeSubTab, option.id, undefined, nextStatus);

      notify({
        type: 'success',
        title: nextStatus ? 'Opción Activada' : 'Opción Desactivada',
        message: `La opción "${option.strname}" ha sido ${nextStatus ? 'habilitada' : 'deshabilitada'} para selección comercial.`,
      });
    } catch (err: any) {
      console.error('Error al conmutar estado de opción:', err);
      // Revertir optimismo
      await fetchOptions();
      const errorMsg =
        err.response?.data?.message || 'Error al cambiar el estado de la opción.';
      notify({
        type: 'error',
        title: 'Error de Estado',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    }
  };

  // Manejo de eliminación
  const handleOpenDelete = (option: OpportunityCatalogOption) => {
    setDeletingOption(option);
  };

  const handleConfirmDelete = async () => {
    if (!deletingOption?.id) return;
    const optionToDelete = deletingOption;
    setDeletingOption(null);

    try {
      setLoading(true);
      await deleteCatalogOption(activeSubTab, optionToDelete.id);
      notify({
        type: 'success',
        title: 'Opción Eliminada',
        message: `La opción "${optionToDelete.strname}" se eliminó definitivamente de ${currentCatalogTitle}.`,
      });
      await fetchOptions();
    } catch (err: any) {
      console.error('Error al eliminar opción de catálogo:', err);
      const errorMsg =
        err.response?.data?.message ||
        'No se pudo eliminar la opción seleccionada. Es posible que esté en uso en el CRM.';
      notify({
        type: 'error',
        title: 'Error al Eliminar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrado y estadísticas calculadas
  const filteredOptions = useMemo(
    () => filterCatalogOptions(options, filters),
    [options, filters]
  );

  const stats = useMemo(() => calculateCatalogStats(options), [options]);

  return (
    <SettingsContainer
      title="Valores de Catálogos"
      description={`Configura y organiza los valores disponibles para ${currentCatalogTitle}. ${activeTabDef.description}`}
      icon={<Database size={20} />}
      rightAction={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => fetchOptions(true, true)}
            disabled={loading}
            title="Recargar valores de catálogo"
            className="!py-2 !px-3 !text-xs !normal-case !tracking-normal gap-1.5 shadow-2xs"
          >
            <RefreshCw
              size={14}
              className={loading ? 'animate-spin text-indigo-650' : 'text-slate-600'}
            />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          <Button
            variant="success"
            onClick={handleOpenCreate}
            className="!py-2 !px-3.5 !text-xs !normal-case !tracking-normal gap-1.5 shadow-xs font-bold"
          >
            <Plus size={15} />
            <span>Nueva Opción</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-1">
        {/* Navegación por Sub-pestañas de Catálogos */}
        <CatalogSubTabsNav
          activeSubTab={activeSubTab}
          onSubTabChange={handleSubTabChange}
          getLabelName={getLabelName}
        />

        {/* Banner de Estadísticas Rápidas */}
        <OpportunityCatalogsStatsBanner stats={stats} />

        {/* Tabla TanStack Compartida */}
        <OpportunityCatalogsTable
          options={filteredOptions}
          totalCount={options.length}
          loading={loading}
          catalogTitle={currentCatalogTitle}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onToggleStatus={handleToggleStatus}
          onViewOpportunities={(opt) => setViewingOpportunitiesOption(opt)}
          searchTerm={filters.search}
          setSearchTerm={(term) => setFilters((prev) => ({ ...prev, search: term }))}
          statusFilter={filters.status}
          setStatusFilter={(status) => setFilters((prev) => ({ ...prev, status }))}
          usageFilter={filters.usage}
          setUsageFilter={(usage) => setFilters((prev) => ({ ...prev, usage }))}
        />
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      <CatalogOptionModal
        open={modalOpen}
        editingOption={editingOption}
        existingOptions={options}
        catalogTitle={currentCatalogTitle}
        onClose={() => {
          setModalOpen(false);
          setEditingOption(null);
        }}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />

      {/* MODAL DE OPORTUNIDADES RELACIONADAS */}
      <RelatedOpportunitiesModal
        open={!!viewingOpportunitiesOption}
        option={viewingOpportunitiesOption}
        catalogTitle={currentCatalogTitle}
        onClose={() => setViewingOpportunitiesOption(null)}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmModal
        open={!!deletingOption}
        onClose={() => setDeletingOption(null)}
        onConfirm={handleConfirmDelete}
        message={`¿Estás seguro de que deseas eliminar permanentemente la opción "${deletingOption?.strname}" de ${currentCatalogTitle}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar Opción"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* NOTIFICACIÓN MODAL COMPARTIDA */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={notification.onConfirm || hideNotification}
        onCancel={notification.onCancel || hideNotification}
      />
    </SettingsContainer>
  );
};

export default OpportunityCatalogsPage;
