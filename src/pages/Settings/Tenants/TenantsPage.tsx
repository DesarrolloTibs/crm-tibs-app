import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Building2, Plus, RefreshCw } from 'lucide-react';

// Componentes Compartidos del Sistema
import SettingsContainer from '../../../components/shared/SettingsContainer';
import Button from '../../../components/shared/Button';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import Notification from '../../../components/shared/Notification';

// Subcomponentes Modulares de Gestión de Organizaciones
import { TenantsStatsBanner } from './components/TenantsStatsBanner';
import { TenantsTable } from './components/TenantsTable';
import { TenantProvisionModal } from './components/TenantProvisionModal';
import { TenantManageModal } from './components/TenantManageModal';

// Esquemas y Tipos
import type {
  TenantPlanInfo,
  Plan,
  TenantFilterState,
  NotificationState,
  ProvisionTenantFormData,
  TenantGeneralFormData,
  RenewalQueueResponse,
  RenewalQueueItem,
} from './schemas/tenants.schema';

// Utilidades y Helpers
import { filterTenants, calculateTenantStats } from './utils/tenants.helpers';

// Servicios API
import {
  getTenants,
  provisionTenant,
  updateTenant,
  updateTenantPlan,
  enqueueTenantRenewal,
  removeQueueItem,
  updateAllowExtra,
  deleteTenant,
  getTenantRenewalQueue,
} from '../../../services/tenantsService';
import { getPlans } from '../../../services/plansService';
import { useConfigStore } from '../../../store/useConfigStore';

export const TenantsPage: React.FC = () => {
  const { tenants, setTenants } = useConfigStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [togglingExtraId, setTogglingExtraId] = useState<number | null>(null);

  // Resumen de períodos en cola por tenant
  const [queueSummaries, setQueueSummaries] = useState<
    Record<number, { total: number; coverageUntil: string | null }>
  >({});

  // Filtros y Búsqueda
  const [filters, setFilters] = useState<TenantFilterState>({
    search: '',
    status: 'all',
  });

  // Modal de Provisión
  const [showProvisionModal, setShowProvisionModal] = useState<boolean>(false);

  // Modal Unificado de Gestión (Datos, Plan, Cola)
  const [manageTenant, setManageTenant] = useState<TenantPlanInfo | null>(null);
  const [manageActiveTab, setManageActiveTab] = useState<'general' | 'plan' | 'queue'>('general');

  // Estado de Cola para el Modal de Gestión
  const [queueLoading, setQueueLoading] = useState<boolean>(false);
  const [queueSubmitting, setQueueSubmitting] = useState<boolean>(false);
  const [queueData, setQueueData] = useState<RenewalQueueResponse | null>(null);

  // Estados para ConfirmModal (Eliminación de tenant y cancelación de período en cola)
  const [deletingTenant, setDeletingTenant] = useState<TenantPlanInfo | null>(null);
  const [deletingQueueItem, setDeletingQueueItem] = useState<RenewalQueueItem | null>(null);

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
    });
  };

  // Carga inicial y refresco de datos
  const loadData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const [tenantsData, plansData] = await Promise.all([getTenants(true), getPlans()]);
      const validTenants = Array.isArray(tenantsData) ? tenantsData : [];
      const validPlans = Array.isArray(plansData) ? plansData : [];

      setTenants(validTenants);
      setPlans(validPlans);

      // Consulta en paralelo para badges y métricas de cola
      validTenants.forEach((t) => {
        if (t.id) {
          getTenantRenewalQueue(t.id)
            .then((res) => {
              if (res) {
                setQueueSummaries((prev) => ({
                  ...prev,
                  [t.id]: { total: res.total_queued_periods, coverageUntil: res.coverage_until },
                }));
              }
            })
            .catch(() => {});
        }
      });
    } catch (err) {
      console.error('Error al cargar organizaciones o planes:', err);
      notify({
        type: 'error',
        title: 'Error de Carga',
        message: 'No fue posible obtener el listado de organizaciones desde el servidor. Por favor, reintenta.',
      });
    } finally {
      setLoading(false);
    }
  }, [setTenants]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cargar cola de renovación de un inquilino específico
  const fetchTenantQueue = useCallback(async (tenantId: number) => {
    setQueueLoading(true);
    try {
      const res = await getTenantRenewalQueue(tenantId);
      setQueueData(res);
      setQueueSummaries((prev) => ({
        ...prev,
        [tenantId]: { total: res.total_queued_periods, coverageUntil: res.coverage_until },
      }));
    } catch (err) {
      console.error('Error al cargar cola de renovación:', err);
    } finally {
      setQueueLoading(false);
    }
  }, []);

  // Abrir Modal de Gestión en una pestaña específica
  const handleOpenManageModal = (
    tenant: TenantPlanInfo,
    tab: 'general' | 'plan' | 'queue' = 'general'
  ) => {
    setManageTenant(tenant);
    setManageActiveTab(tab);
    fetchTenantQueue(tenant.id);
  };

  // Abrir directamente la pestaña de cola desde la tabla
  const handleOpenQueue = (tenant: TenantPlanInfo) => {
    handleOpenManageModal(tenant, 'queue');
  };

  // Provisión de Nueva Organización
  const handleProvisionSubmit = async (formData: ProvisionTenantFormData) => {
    setSubmitting(true);
    try {
      const res = await provisionTenant({
        tenantName: formData.tenantName,
        adminUsername: formData.adminUsername,
        adminEmail: formData.adminEmail,
        planId: formData.planId ?? undefined,
        billingPeriodMonths: formData.billingPeriodMonths,
      });

      setShowProvisionModal(false);
      await loadData();

      notify({
        type: 'success',
        title: 'Organización Aprovisionada',
        message: `Organización ${res.schemaName} creada correctamente. Usuario Admin: ${res.adminUsername} (${res.adminEmail}). Contraseña Temporal: ${res.tempPassword}`,
      });
    } catch (err: any) {
      console.error('Error al provisionar organización:', err);
      const errorMsg =
        err.response?.data?.message || err.message || 'Error desconocido al crear la organización.';
      notify({
        type: 'error',
        title: 'Error de Provisión',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Guardar Cambios Generales
  const handleUpdateGeneral = async (data: TenantGeneralFormData) => {
    if (!manageTenant) return;
    setSubmitting(true);
    try {
      await updateTenant(manageTenant.id, {
        name: data.name,
        is_active: data.is_active,
        allow_extra: data.allow_extra,
      });

      setManageTenant(null);
      await loadData();

      notify({
        type: 'success',
        title: 'Organización Actualizada',
        message: `Los datos generales de "${data.name}" se actualizaron correctamente.`,
      });
    } catch (err: any) {
      console.error('Error al actualizar organización:', err);
      const errorMsg =
        err.response?.data?.message || err.message || 'Error al guardar los cambios generales.';
      notify({
        type: 'error',
        title: 'Error al Actualizar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Asignar Plan
  const handleAssignPlan = async (planData: {
    planId: number;
    changeType: 'immediate' | 'next_period';
    immediatePolicy?: 'reset_date' | 'keep_current_date';
    months: number;
    updateQueuedPlans?: boolean;
    allowExtra?: boolean;
  }) => {
    if (!manageTenant) return;
    setSubmitting(true);

    try {
      await updateTenantPlan(manageTenant.id, planData);
      setManageTenant(null);
      await fetchTenantQueue(manageTenant.id);
      await loadData();

      notify({
        type: 'success',
        title:
          planData.changeType === 'immediate'
            ? 'Plan Actualizado Exitosamente'
            : 'Cambio de Plan Programado',
        message:
          planData.changeType === 'immediate'
            ? `La suscripción de ${manageTenant.name} fue actualizada de inmediato.`
            : `El nuevo plan se programó en la cola y se activará automáticamente al vencer el ciclo actual.`,
      });
    } catch (err: any) {
      console.error('Error al actualizar plan:', err);
      const errorMsg =
        err.response?.data?.message || err.message || 'No fue posible modificar la suscripción.';
      notify({
        type: 'error',
        title: 'Error al Actualizar Plan',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Encolar Períodos
  const handleEnqueueRenewal = async (data: { planId: number; periodsCount: number }) => {
    if (!manageTenant) return;
    setQueueSubmitting(true);
    const selectedQPlan = plans.find((p) => p.plan_id === data.planId);
    const resolvedQueueMonths = selectedQPlan?.billing_period_months || 1;

    try {
      await enqueueTenantRenewal(manageTenant.id, {
        planId: data.planId,
        months: resolvedQueueMonths,
        periodsCount: data.periodsCount,
      });

      await fetchTenantQueue(manageTenant.id);
      await loadData();

      notify({
        type: 'success',
        title: 'Renovaciones en Cola Agregadas',
        message: `Se encolaron satisfactoriamente ${data.periodsCount} período(s) de renovación para ${manageTenant.name}.`,
      });
    } catch (err: any) {
      console.error('Error al encolar renovación:', err);
      const errorMsg =
        err.response?.data?.message || err.message || 'No se pudo encolar el período.';
      notify({
        type: 'error',
        title: 'Error al Encolar Renovación',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setQueueSubmitting(false);
    }
  };

  // Confirmar eliminación de período en cola
  const handleConfirmDeleteQueueItem = async () => {
    if (!deletingQueueItem || !manageTenant) return;
    const item = deletingQueueItem;
    setDeletingQueueItem(null);

    try {
      await removeQueueItem(item.queue_id);
      await fetchTenantQueue(manageTenant.id);
      await loadData();

      notify({
        type: 'success',
        title: 'Período Cancelado',
        message: `El período #${item.queue_position} de renovación ha sido eliminado de la cola.`,
      });
    } catch (err: any) {
      console.error('Error al cancelar período:', err);
      const errorMsg =
        err.response?.data?.message || err.message || 'No fue posible cancelar el período en cola.';
      notify({
        type: 'error',
        title: 'Error al Cancelar Período',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    }
  };

  // Toggle rápido de allow_extra en la tabla
  const handleToggleAllowExtra = async (tenant: TenantPlanInfo) => {
    setTogglingExtraId(tenant.id);
    try {
      await updateAllowExtra(tenant.id, !tenant.allow_extra);
      await loadData();
    } catch (err: any) {
      console.error('Error al modificar permiso de excedente:', err);
      const errorMsg =
        err.response?.data?.message || err.message || 'Error al cambiar permiso de sobreconsumo.';
      notify({
        type: 'error',
        title: 'Error',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setTogglingExtraId(null);
    }
  };

  // Confirmar eliminación de tenant
  const handleConfirmDeleteTenant = async () => {
    if (!deletingTenant) return;
    const tenantToDelete = deletingTenant;
    setDeletingTenant(null);

    try {
      setLoading(true);
      await deleteTenant(tenantToDelete.id);
      if (manageTenant?.id === tenantToDelete.id) {
        setManageTenant(null);
      }
      await loadData();

      notify({
        type: 'success',
        title: 'Organización Eliminada',
        message: `La organización '${tenantToDelete.name}' (${tenantToDelete.schema_name}) fue eliminada exitosamente.`,
      });
    } catch (err: any) {
      console.error('Error al eliminar organización:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'No se pudo eliminar la base de datos de la organización.';
      notify({
        type: 'error',
        title: 'Error al Eliminar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrado y cálculo de KPIs reactivos
  const filteredTenants = useMemo(
    () => filterTenants(tenants, filters, queueSummaries),
    [tenants, filters, queueSummaries]
  );

  const stats = useMemo(
    () => calculateTenantStats(tenants, queueSummaries),
    [tenants, queueSummaries]
  );

  return (
    <SettingsContainer
      title="Gestión de Organizaciones"
      description="Supervisa inquilinos multitenant, aprovisiona esquemas de base de datos, gestiona suscripciones, cupos de tokens y colas de renovación."
      icon={<Building2 size={20} />}
      rightAction={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => loadData(true)}
            disabled={loading}
            title="Recargar organizaciones"
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
            onClick={() => setShowProvisionModal(true)}
            className="!py-2 !px-3.5 !text-xs !normal-case !tracking-normal gap-1.5 shadow-xs font-bold"
          >
            <Plus size={15} />
            <span>Provisionar Organización</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-1">
        {/* Banner de Estadísticas Rápidas (KPIs) */}
        <TenantsStatsBanner stats={stats} />

        {/* Tabla TanStack Compartida */}
        <TenantsTable
          tenants={filteredTenants}
          totalCount={tenants.length}
          loading={loading}
          onEdit={(t) => handleOpenManageModal(t, 'general')}
          onDelete={(t) => setDeletingTenant(t)}
          onToggleAllowExtra={handleToggleAllowExtra}
          onOpenQueue={handleOpenQueue}
          queueSummaries={queueSummaries}
          togglingExtraId={togglingExtraId}
          searchTerm={filters.search}
          setSearchTerm={(term) => setFilters((prev) => ({ ...prev, search: term }))}
          statusFilter={filters.status}
          setStatusFilter={(status) => setFilters((prev) => ({ ...prev, status }))}
        />
      </div>

      {/* MODAL DE PROVISIÓN DE ORGANIZACIÓN */}
      <TenantProvisionModal
        open={showProvisionModal}
        onClose={() => setShowProvisionModal(false)}
        onSubmit={handleProvisionSubmit}
        plans={plans}
        submitting={submitting}
      />

      {/* MODAL UNIFICADO DE GESTIÓN (DATOS, PLAN, COLA) */}
      <TenantManageModal
        open={Boolean(manageTenant)}
        tenant={manageTenant}
        activeTab={manageActiveTab}
        setActiveTab={setManageActiveTab}
        onClose={() => setManageTenant(null)}
        plans={plans}
        onUpdateGeneral={handleUpdateGeneral}
        onAssignPlan={handleAssignPlan}
        onEnqueueRenewal={handleEnqueueRenewal}
        onRemoveQueueItem={(item) => setDeletingQueueItem(item)}
        onRefreshQueue={() => manageTenant && fetchTenantQueue(manageTenant.id)}
        queueData={queueData}
        queueLoading={queueLoading}
        queueSubmitting={queueSubmitting}
        submitting={submitting}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE ORGANIZACIÓN */}
      <ConfirmModal
        open={Boolean(deletingTenant)}
        onClose={() => setDeletingTenant(null)}
        onConfirm={handleConfirmDeleteTenant}
        message={`¿Estás seguro de que deseas eliminar la organización "${deletingTenant?.name}" (${deletingTenant?.schema_name})? Esta acción eliminará su base de datos permanentemente.`}
        confirmLabel="Eliminar Organización"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* MODAL DE CONFIRMACIÓN DE CANCELACIÓN DE PERÍODO EN COLA */}
      <ConfirmModal
        open={Boolean(deletingQueueItem)}
        onClose={() => setDeletingQueueItem(null)}
        onConfirm={handleConfirmDeleteQueueItem}
        message={`¿Estás seguro de que deseas cancelar la renovación programada #${deletingQueueItem?.queue_position} (${deletingQueueItem?.plan_name} - ${deletingQueueItem?.billing_period_months} mes(es))?`}
        confirmLabel="Cancelar Período"
        cancelLabel="Regresar"
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

export default TenantsPage;
