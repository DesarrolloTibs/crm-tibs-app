import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Layers, Plus, RefreshCw } from 'lucide-react';

// Componentes Compartidos del Sistema
import SettingsContainer from '../../../components/shared/SettingsContainer';
import Button from '../../../components/shared/Button';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import Notification from '../../../components/shared/Notification';

// Subcomponentes Modulares de Planes de Suscripción
import { SubscriptionPlansStatsBanner } from './components/SubscriptionPlansStatsBanner';
import { SubscriptionPlansTable } from './components/SubscriptionPlansTable';
import { SubscriptionPlanModal } from './components/SubscriptionPlanModal';

// Esquemas y Tipos
import type {
  Plan,
  SubscriptionPlanFormData,
  SubscriptionPlanFilterState,
  NotificationState,
} from './schemas/subscriptionPlans.schema';

// Utilidades y Helpers
import {
  filterSubscriptionPlans,
  calculateSubscriptionPlanStats,
} from './utils/subscriptionPlans.helpers';

// Servicios API
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from '../../../services/plansService';

export const SubscriptionPlansPage: React.FC = () => {
  // Estado de datos
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filtros y Búsqueda
  const [filters, setFilters] = useState<SubscriptionPlanFilterState>({
    search: '',
    status: 'all',
  });

  // Estados de Modales
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

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

  // Guard ref para evitar peticiones duplicadas simultáneas (StrictMode o remount)
  const isFetchingRef = useRef<boolean>(false);

  // Cargar planes de suscripción desde la API
  const fetchPlans = useCallback(async (isManual = false) => {
    if (isFetchingRef.current && !isManual) return;
    isFetchingRef.current = true;

    try {
      if (isManual) setLoading(true);
      const data = await getPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar planes de suscripción:', err);
      notify({
        type: 'error',
        title: 'Error de Carga',
        message: 'No fue posible obtener el catálogo de planes desde el servidor. Por favor, reintenta.',
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Manejo de creación y edición
  const handleOpenCreate = () => {
    setEditingPlan(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData: SubscriptionPlanFormData) => {
    setSubmitting(true);
    try {
      if (editingPlan?.plan_id) {
        await updatePlan(editingPlan.plan_id, {
          plan_name: formData.plan_name,
          price: formData.price,
          tokens_limit: formData.tokens_limit,
          billing_period_months: formData.billing_period_months,
          blnstatus: formData.blnstatus,
        });
        notify({
          type: 'success',
          title: '¡Plan Actualizado!',
          message: `El plan "${formData.plan_name}" se ha modificado exitosamente.`,
        });
      } else {
        await createPlan({
          plan_name: formData.plan_name,
          price: formData.price,
          tokens_limit: formData.tokens_limit,
          billing_period_months: formData.billing_period_months,
          blnstatus: formData.blnstatus,
        });
        notify({
          type: 'success',
          title: '¡Plan Registrado!',
          message: `El nuevo plan "${formData.plan_name}" fue registrado y está listo para ser asignado.`,
        });
      }

      setModalOpen(false);
      setEditingPlan(null);
      await fetchPlans();
    } catch (err: any) {
      console.error('Error al guardar plan de suscripción:', err);
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

  // Manejo de eliminación / desactivación
  const handleOpenDelete = (plan: Plan) => {
    setDeletingPlan(plan);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPlan?.plan_id) return;
    const planToDelete = deletingPlan;
    setDeletingPlan(null);

    try {
      setLoading(true);
      await deletePlan(planToDelete.plan_id);
      notify({
        type: 'success',
        title: 'Plan Desactivado',
        message: `El plan "${planToDelete.plan_name}" fue desactivado del catálogo correctamente.`,
      });
      await fetchPlans();
    } catch (err: any) {
      console.error('Error al desactivar plan de suscripción:', err);
      const errorMsg =
        err.response?.data?.message ||
        'No se pudo desactivar el plan de suscripción seleccionado.';
      notify({
        type: 'error',
        title: 'Error al Desactivar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrado y estadísticas calculadas
  const filteredPlans = useMemo(
    () => filterSubscriptionPlans(plans, filters),
    [plans, filters]
  );

  const stats = useMemo(() => calculateSubscriptionPlanStats(plans), [plans]);

  return (
    <SettingsContainer
      title="Planes de Suscripción"
      description="Define el precio, límite estricto de consumo de tokens y periodicidad de facturación de cada nivel de servicio SaaS de la plataforma."
      icon={<Layers size={20} />}
      rightAction={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => fetchPlans(true)}
            disabled={loading}
            title="Recargar planes de suscripción"
            className="!py-2 !px-3 !text-xs !normal-case !tracking-normal gap-1.5 shadow-2xs"
          >
            <RefreshCw
              size={14}
              className={loading ? 'animate-spin text-indigo-650' : 'text-slate-600'}
            />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          <Button
            variant="indigo"
            onClick={handleOpenCreate}
            className="!py-2 !px-3.5 !text-xs !normal-case !tracking-normal gap-1.5 shadow-xs font-bold"
          >
            <Plus size={15} />
            <span>Nuevo Plan</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-1">
        {/* Banner de Estadísticas Rápidas */}
        <SubscriptionPlansStatsBanner stats={stats} />

        {/* Tabla Compartida TanStack Table */}
        <SubscriptionPlansTable
          plans={filteredPlans}
          totalCount={plans.length}
          loading={loading}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          searchTerm={filters.search}
          setSearchTerm={(term) => setFilters((prev) => ({ ...prev, search: term }))}
          statusFilter={filters.status}
          setStatusFilter={(status) => setFilters((prev) => ({ ...prev, status }))}
        />
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      <SubscriptionPlanModal
        open={modalOpen}
        editingPlan={editingPlan}
        onClose={() => {
          setModalOpen(false);
          setEditingPlan(null);
        }}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN / DESACTIVACIÓN */}
      <ConfirmModal
        open={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        onConfirm={handleConfirmDelete}
        message={`¿Estás seguro de que deseas desactivar el plan "${deletingPlan?.plan_name}"? Pasará a estado inactivo y no podrá ser asignado a nuevas organizaciones.`}
        confirmLabel="Desactivar Plan"
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

export default SubscriptionPlansPage;
