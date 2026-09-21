import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Plus, Calendar, ShieldAlert, CheckCircle, ToggleLeft, ToggleRight, 
  Pencil, Trash2, Clock, Layers, RefreshCw, ArrowRight, Sparkles, X, 
  Settings2
} from 'lucide-react';
import Notification from '../Modal/Notification';
import Modal from '../Modal/Modal';
import Button from '../shared/Button';
import Select from '../shared/Select';
import { 
  getTenants, provisionTenant, updateTenantPlan, enqueueTenantRenewal, 
  updateAllowExtra, updateTenant, deleteTenant, getTenantRenewalQueue, 
  removeQueueItem 
} from '../../services/tenantsService';
import type { RenewalQueueResponse, RenewalQueueItem } from '../../services/tenantsService';
import { getPlans } from '../../services/plansService';
import type { Plan } from '../../services/plansService';
import { useConfigStore } from '../../store/useConfigStore';
import type { TenantPlanInfo } from '../../store/useConfigStore';

const TenantsSection: React.FC = () => {
  const { tenants, setTenants } = useConfigStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);

  // Resumen de períodos en cola por tenant (para alimentar badges en la tabla)
  const [queueSummaries, setQueueSummaries] = useState<Record<number, { total: number; coverageUntil: string | null }>>({});

  // Notification State estándar compartido
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Modal de provisión nueva
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>(undefined);
  const [billingMonths] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Modal Unificado de Gestión de Organización
  const [manageTenant, setManageTenant] = useState<TenantPlanInfo | null>(null);
  const [manageActiveTab, setManageActiveTab] = useState<'general' | 'plan' | 'queue'>('general');

  // Pestaña General
  const [editTenantName, setEditTenantName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editAllowExtra, setEditAllowExtra] = useState(false);

  // Pestaña Plan
  const [assignPlanId, setAssignPlanId] = useState<number>(1);
  const [assignAllowExtra, setAssignAllowExtra] = useState<boolean>(false);
  const [planApplicationMode, setPlanApplicationMode] = useState<'immediate_keep' | 'immediate_reset' | 'next_period'>('immediate_keep');
  const [updateQueuedPlans, setUpdateQueuedPlans] = useState<boolean>(false);

  // Pestaña Cola
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueSubmitting, setQueueSubmitting] = useState(false);
  const [queueData, setQueueData] = useState<RenewalQueueResponse | null>(null);
  const [queuePlanId, setQueuePlanId] = useState<number>(1);
  const [queuePeriodsCount, setQueuePeriodsCount] = useState<number>(1);

  // Opciones estandarizadas para el componente Select compartido
  const planOptions = useMemo(() => (plans || []).map(p => ({
    value: p.plan_id,
    label: `${p.plan_name} — $${Number(p.price).toFixed(2)} (${p.tokens_limit.toLocaleString()} tokens)`
  })), [plans]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenantsData, plansData] = await Promise.all([getTenants(true), getPlans()]);
      const validTenants = Array.isArray(tenantsData) ? tenantsData : [];
      const validPlans = Array.isArray(plansData) ? plansData : [];
      setTenants(validTenants);
      setPlans(validPlans);
      if (validPlans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(validPlans[0].plan_id);
        setAssignPlanId(validPlans[0].plan_id);
        setQueuePlanId(validPlans[0].plan_id);
      }

      // Consulta en background para badges de cola
      validTenants.forEach(t => {
        if (t.id) {
          getTenantRenewalQueue(t.id)
            .then(res => {
              if (res) {
                setQueueSummaries(prev => ({
                  ...prev,
                  [t.id]: { total: res.total_queued_periods, coverageUntil: res.coverage_until }
                }));
              }
            })
            .catch(() => {});
        }
      });
    } catch (err) {
      console.error('Error al cargar tenants o planes:', err);
      setTenants([]);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await provisionTenant({
        tenantName,
        adminUsername,
        adminEmail,
        planId: selectedPlanId,
        billingPeriodMonths: billingMonths,
      });

      setShowProvisionModal(false);
      setTenantName('');
      setAdminUsername('');
      setAdminEmail('');

      await loadData();

      setNotification({
        show: true,
        type: 'success',
        title: 'Organización Aprovisionada',
        message: `Organización ${res.schemaName} creada correctamente. Usuario Admin: ${res.adminUsername} (${res.adminEmail}). Contraseña Temporal: ${res.tempPassword}`,
        onConfirm: hideNotification,
      });
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error de Provisión',
        message: err.response?.data?.message || err.message,
        onConfirm: hideNotification,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir Modal Unificado de Gestión
  const handleOpenManageModal = (t: TenantPlanInfo, tab: 'general' | 'plan' | 'queue' = 'general') => {
    setManageTenant(t);
    setManageActiveTab(tab);

    // Inicializar datos generales
    setEditTenantName(t.name);
    setEditIsActive(t.is_active);
    setEditAllowExtra(t.allow_extra);

    // Inicializar datos de plan
    const initialPlanId = t.plan_id || (plans[0]?.plan_id ?? 1);
    setAssignPlanId(initialPlanId);
    setAssignAllowExtra(t.allow_extra);
    setPlanApplicationMode('immediate_keep');
    setUpdateQueuedPlans(false);

    // Inicializar datos de cola
    setQueuePlanId(initialPlanId);
    setQueuePeriodsCount(1);
    fetchTenantQueue(t.id);
  };

  // Cargar datos de la cola para un tenant específico
  const fetchTenantQueue = async (tenantId: number) => {
    setQueueLoading(true);
    try {
      const res = await getTenantRenewalQueue(tenantId);
      setQueueData(res);
      setQueueSummaries(prev => ({
        ...prev,
        [tenantId]: { total: res.total_queued_periods, coverageUntil: res.coverage_until }
      }));
    } catch (err: any) {
      console.error('Error al cargar la cola de renovación:', err);
    } finally {
      setQueueLoading(false);
    }
  };

  // Guardar Cambios Generales
  const handleEditTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageTenant) return;
    setSubmitting(true);
    try {
      const updated = await updateTenant(manageTenant.id, {
        name: editTenantName,
        is_active: editIsActive,
        allow_extra: editAllowExtra,
      });
      setManageTenant(prev => prev ? { ...prev, ...updated } : null);
      await loadData();
      setNotification({
        show: true,
        type: 'success',
        title: 'Organización Actualizada',
        message: 'Los datos generales de la organización se actualizaron correctamente.',
        onConfirm: hideNotification,
      });
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error al Actualizar',
        message: err.response?.data?.message || err.message,
        onConfirm: hideNotification,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Guardar Cambio de Plan
  const handleAssignPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageTenant) return;
    setSubmitting(true);

    const resolvedChangeType = planApplicationMode === 'next_period' ? 'next_period' : 'immediate';
    const resolvedImmediatePolicy = planApplicationMode === 'immediate_keep' ? 'keep_current_date' : 'reset_date';
    const selectedPlan = plans.find(p => p.plan_id === assignPlanId);
    const resolvedMonths = selectedPlan?.billing_period_months || 1;

    try {
      const updated = await updateTenantPlan(manageTenant.id, {
        planId: assignPlanId,
        changeType: resolvedChangeType,
        immediatePolicy: resolvedChangeType === 'immediate' ? resolvedImmediatePolicy : undefined,
        months: resolvedMonths,
        updateQueuedPlans: resolvedChangeType === 'immediate' ? updateQueuedPlans : undefined,
        allowExtra: assignAllowExtra,
      });
      setManageTenant(prev => prev ? { ...prev, ...updated } : null);
      await fetchTenantQueue(manageTenant.id);
      await loadData();
      setNotification({
        show: true,
        type: 'success',
        title: resolvedChangeType === 'immediate' ? 'Plan Actualizado Exitosamente' : 'Cambio de Plan Programado',
        message: resolvedChangeType === 'immediate'
          ? `La suscripción de ${manageTenant.name} fue actualizada de inmediato.`
          : `El nuevo plan se programó en la cola y se activará automáticamente al vencer el ciclo actual.`,
        onConfirm: hideNotification,
      });
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error al Actualizar Plan',
        message: err.response?.data?.message || err.message,
        onConfirm: hideNotification,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Encolar Períodos
  const handleQueueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageTenant) return;
    setQueueSubmitting(true);
    const selectedQPlan = plans.find(p => p.plan_id === queuePlanId);
    const resolvedQueueMonths = selectedQPlan?.billing_period_months || 1;

    try {
      await enqueueTenantRenewal(manageTenant.id, {
        planId: queuePlanId,
        months: resolvedQueueMonths,
        periodsCount: queuePeriodsCount,
      });
      await fetchTenantQueue(manageTenant.id);
      await loadData();
      setNotification({
        show: true,
        type: 'success',
        title: 'Renovaciones en Cola Agregadas',
        message: `Se encolaron satisfactoriamente ${queuePeriodsCount} período(s) de renovación para ${manageTenant.name}.`,
        onConfirm: hideNotification,
      });
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error al Encolar Renovación',
        message: err.response?.data?.message || err.message,
        onConfirm: hideNotification,
      });
    } finally {
      setQueueSubmitting(false);
    }
  };

  // Eliminar un período individual de la cola
  const handleRemoveQueueItem = (item: RenewalQueueItem) => {
    if (!manageTenant) return;
    setNotification({
      show: true,
      type: 'confirmation',
      title: '¿Cancelar Período en Cola?',
      message: `¿Estás seguro de que deseas cancelar la renovación programada #${item.queue_position} (${item.plan_name} - ${item.billing_period_months} mes(es))?`,
      onConfirm: async () => {
        hideNotification();
        try {
          await removeQueueItem(item.queue_id);
          await fetchTenantQueue(manageTenant.id);
          await loadData();
          setNotification({
            show: true,
            type: 'success',
            title: 'Período Cancelado',
            message: `El período #${item.queue_position} de renovación ha sido eliminado de la cola.`,
            onConfirm: hideNotification,
          });
        } catch (err: any) {
          setNotification({
            show: true,
            type: 'error',
            title: 'Error al Cancelar Período',
            message: err.response?.data?.message || err.message,
            onConfirm: hideNotification,
          });
        }
      },
      onCancel: hideNotification,
    });
  };

  const handleToggleAllowExtra = async (t: TenantPlanInfo) => {
    try {
      await updateAllowExtra(t.id, !t.allow_extra);
      await loadData();
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || err.message,
        onConfirm: hideNotification,
      });
    }
  };

  const handleDeleteTenant = (t: TenantPlanInfo) => {
    setNotification({
      show: true,
      type: 'confirmation',
      title: '¿Eliminar Organización?',
      message: `¿Estás seguro de que deseas eliminar la organización ${t.name} (${t.schema_name})? Esta acción eliminará su base de datos permanentemente.`,
      onConfirm: async () => {
        hideNotification();
        try {
          await deleteTenant(t.id);
          if (manageTenant?.id === t.id) {
            setManageTenant(null);
          }
          await loadData();
          setNotification({
            show: true,
            type: 'success',
            title: 'Organización Eliminada',
            message: `La organización '${t.name}' fue eliminada exitosamente.`,
            onConfirm: hideNotification,
          });
        } catch (err: any) {
          setNotification({
            show: true,
            type: 'error',
            title: 'Error',
            message: err.response?.data?.message || err.message,
            onConfirm: hideNotification,
          });
        }
      },
      onCancel: hideNotification,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Dinámico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={24} />
            Gestión Centralizada de Organizaciones (Tenants)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Administra suscripciones, asignación flexible de planes, colas de renovación y límites de consumo de IA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="icon"
            onClick={() => loadData()}
            title="Refrescar lista de organizaciones"
            className="!p-2.5 !border !border-slate-200 !rounded-xl text-slate-500 hover:!text-indigo-600 hover:!bg-slate-100"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button
            variant="indigo"
            onClick={() => setShowProvisionModal(true)}
            className="!py-2.5 !px-4 !normal-case !tracking-normal !text-sm gap-2"
          >
            <Plus size={18} />
            Provisionar Organización
          </Button>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin text-indigo-500" />
            Cargando organizaciones...
          </div>
        ) : !Array.isArray(tenants) || tenants.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No hay organizaciones registradas aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Organización</th>
                  <th className="py-3.5 px-4">Plan Actual</th>
                  <th className="py-3.5 px-4">Próxima Renovación</th>
                  <th className="py-3.5 px-4">Consumo Excedente</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(tenants) ? tenants : []).map(t => {
                  const queuedSummary = queueSummaries[t.id];
                  const queuedCount = t.total_queued_periods ?? queuedSummary?.total ?? 0;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{t.name}</div>
                        <div className="text-xs font-mono text-indigo-600">{t.schema_name}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {t.plan ? (
                          <div>
                            <span className="inline-block font-semibold text-slate-700">{t.plan.plan_name}</span>
                            <div className="text-xs text-slate-400 font-mono">
                              {t.plan.tokens_limit.toLocaleString()} tokens / {t.plan.billing_period_months} m.
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                            Sin Plan
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {t.next_renewal_date ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700">
                              <Calendar size={13} className="text-slate-400 shrink-0" />
                              {new Date(t.next_renewal_date).toLocaleDateString()}
                            </div>
                            {queuedCount > 0 && (
                              <Button
                                variant="ghost"
                                onClick={() => handleOpenManageModal(t, 'queue')}
                                title={`Ver cola: ${queuedCount} período(s) respaldados.`}
                                className="inline-flex items-center gap-1 !text-[11px] !font-semibold text-indigo-700 bg-indigo-50 hover:!bg-indigo-100 border border-indigo-200/80 !px-2 !py-0.5 !rounded-full transition-colors"
                              >
                                <Clock size={11} className="text-indigo-500" />
                                +{queuedCount} en cola
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Button
                          variant="ghost"
                          onClick={() => handleToggleAllowExtra(t)}
                          className={`flex items-center gap-1.5 !text-xs !font-semibold !px-2.5 !py-1 !rounded-lg transition-all ${
                            t.allow_extra
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:!bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:!bg-slate-200'
                          }`}
                        >
                          {t.allow_extra ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          {t.allow_extra ? 'Permitido' : 'Bloqueado'}
                        </Button>
                      </td>

                      <td className="py-3.5 px-4">
                        {t.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                            <CheckCircle size={12} /> Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                            <ShieldAlert size={12} /> Expirada / Inactiva
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón único de Configuración / Edición */}
                          <Button
                            variant="secondary"
                            onClick={() => handleOpenManageModal(t, 'general')}
                            title="Gestionar organización (Datos, Plan y Cola)"
                            className="!inline-flex !items-center !justify-center !h-8 !py-0 !px-3 !text-xs !font-semibold !normal-case !tracking-normal gap-1.5 bg-slate-100 hover:!bg-indigo-50 text-slate-700 hover:!text-indigo-700 !border-slate-200 hover:!border-indigo-200 shadow-xs"
                          >
                            <Pencil size={13} />
                            Editar
                          </Button>

                          {/* Botón de Eliminar */}
                          <Button
                            variant="ghost-danger"
                            onClick={() => handleDeleteTenant(t)}
                            title="Eliminar organización permanentemente"
                            className="!inline-flex !items-center !justify-center !h-8 !w-8 !p-0 bg-red-50 text-red-600 hover:!bg-red-100 !rounded-lg"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Provisionar Organización (Componente Compartido Modal) */}
      <Modal
        open={showProvisionModal}
        onClose={() => setShowProvisionModal(false)}
        maxWidth="max-w-md"
        height="h-auto"
        padding="p-6"
        className="rounded-2xl shadow-xl"
        hideCloseButton={true}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 size={20} className="text-indigo-600" />
              Provisionar Nueva Organización
            </h3>
            <Button
              variant="icon"
              onClick={() => setShowProvisionModal(false)}
              className="!text-slate-400 hover:!text-slate-600 !p-1 hover:!bg-slate-100"
            >
              <X size={18} />
            </Button>
          </div>

          <form onSubmit={handleProvisionSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la Organización</label>
              <input
                type="text"
                required
                placeholder="ej. Empresa Acme SA"
                value={tenantName}
                onChange={e => setTenantName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Username del Admin Inicial</label>
              <input
                type="text"
                required
                placeholder="ej. admin_acme"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email del Admin Inicial</label>
              <input
                type="email"
                required
                placeholder="admin@acme.com"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="provisionPlanId" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Plan Inicial
              </label>
              <Select
                inputId="provisionPlanId"
                value={planOptions.find(opt => opt.value === selectedPlanId)}
                onChange={(selected: any) => setSelectedPlanId(selected ? Number(selected.value) : undefined)}
                options={planOptions}
                isSearchable={false}
                placeholder="Seleccione un plan inicial..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => setShowProvisionModal(false)}
                className="!py-2 !px-4 !text-sm !font-medium !normal-case !tracking-normal"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="indigo"
                loading={submitting}
                className="!py-2 !px-4 !text-sm !font-semibold !normal-case !tracking-normal"
              >
                Crear Esquema
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL UNIFICADO: GESTIÓN INTEGRAL DE ORGANIZACIÓN (Componente Compartido Modal) */}
      <Modal
        open={Boolean(manageTenant)}
        onClose={() => setManageTenant(null)}
        maxWidth="max-w-2xl"
        height="max-h-[90vh]"
        padding="p-0"
        className="rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
        hideCloseButton={true}
      >
        {manageTenant && (
          <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header del Modal */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Settings2 size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {manageTenant.name}
                  </h3>
                  <div className="text-xs font-mono text-indigo-600">
                    Esquema: {manageTenant.schema_name}
                  </div>
                </div>
              </div>

              <Button
                variant="icon"
                onClick={() => setManageTenant(null)}
                className="!text-slate-400 hover:!text-slate-600 !p-1.5 hover:!bg-slate-100"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Pestañas de Navegación (Tabs) */}
            <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setManageActiveTab('general')}
                className={`!py-3 !px-4 !text-xs !font-bold flex items-center gap-2 border-b-2 !rounded-none transition-all ${
                  manageActiveTab === 'general'
                    ? '!border-indigo-600 !text-indigo-600 !bg-white'
                    : '!border-transparent !text-slate-500 hover:!text-slate-700'
                }`}
              >
                <Building2 size={15} />
                General
              </Button>

              <Button
                variant="ghost"
                type="button"
                onClick={() => setManageActiveTab('plan')}
                className={`!py-3 !px-4 !text-xs !font-bold flex items-center gap-2 border-b-2 !rounded-none transition-all ${
                  manageActiveTab === 'plan'
                    ? '!border-indigo-600 !text-indigo-600 !bg-white'
                    : '!border-transparent !text-slate-500 hover:!text-slate-700'
                }`}
              >
                <Sparkles size={15} />
                Plan & Suscripción
              </Button>

              <Button
                variant="ghost"
                type="button"
                onClick={() => setManageActiveTab('queue')}
                className={`!py-3 !px-4 !text-xs !font-bold flex items-center gap-2 border-b-2 !rounded-none transition-all ${
                  manageActiveTab === 'queue'
                    ? '!border-indigo-600 !text-indigo-600 !bg-white'
                    : '!border-transparent !text-slate-500 hover:!text-slate-700'
                }`}
              >
                <Layers size={15} />
                Cola de Renovación
                {(queueData?.total_queued_periods || 0) > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {queueData?.total_queued_periods}
                  </span>
                )}
              </Button>
            </div>

            {/* Contenido según Pestaña Activa */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* TAB 1: GENERAL */}
              {manageActiveTab === 'general' && (
                <form onSubmit={handleEditTenantSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la Organización</label>
                    <input
                      type="text"
                      required
                      value={editTenantName}
                      onChange={e => setEditTenantName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Esquema de Base de Datos</label>
                    <input
                      type="text"
                      disabled
                      value={manageTenant.schema_name}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-400 rounded-xl text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={e => setEditIsActive(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      Organización Activa (Permite el inicio de sesión a sus usuarios)
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={editAllowExtra}
                        onChange={e => setEditAllowExtra(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      Permitir Consumo Excedente de Tokens (Sobrefacturación autorizada)
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <Button
                      variant="secondary"
                      onClick={() => setManageTenant(null)}
                      className="!py-2 !px-4 !text-sm !font-medium !normal-case !tracking-normal"
                    >
                      Cerrar
                    </Button>
                    <Button
                      type="submit"
                      variant="indigo"
                      loading={submitting}
                      className="!py-2 !px-4 !text-sm !font-semibold !normal-case !tracking-normal"
                    >
                      Guardar Cambios Generales
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB 2: PLAN & SUSCRIPCIÓN */}
              {manageActiveTab === 'plan' && (
                <form onSubmit={handleAssignPlanSubmit} className="space-y-4">
                  {/* Selector de Plan y Duración Heredada */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="assignPlanId" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Nuevo Plan
                      </label>
                      <Select
                        inputId="assignPlanId"
                        value={planOptions.find(opt => opt.value === assignPlanId)}
                        onChange={(selected: any) => selected && setAssignPlanId(Number(selected.value))}
                        options={planOptions}
                        isSearchable={false}
                        placeholder="Seleccione un plan..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Duración del Plan
                      </label>
                      <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 flex items-center justify-between min-h-[54px]">
                        <span>
                          {plans.find(p => p.plan_id === assignPlanId)?.billing_period_months || 1} mes(es)
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
                          {(plans.find(p => p.plan_id === assignPlanId)?.billing_period_months || 1) === 12
                            ? 'Anual'
                            : (plans.find(p => p.plan_id === assignPlanId)?.billing_period_months || 1) === 1
                            ? 'Mensual'
                            : `${plans.find(p => p.plan_id === assignPlanId)?.billing_period_months || 1} meses`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Opciones Directas de Aplicación */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Modalidad de Aplicación del Plan
                    </label>
                    <div className="space-y-2.5">
                      {/* Opción 1: Upgrade Inmediato */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          planApplicationMode === 'immediate_keep'
                            ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="planApplicationMode"
                          value="immediate_keep"
                          checked={planApplicationMode === 'immediate_keep'}
                          onChange={() => setPlanApplicationMode('immediate_keep')}
                          className="mt-0.5 text-indigo-600"
                        />
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            Upgrade Inmediato (Mantener fecha de corte actual)
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Aplica el nuevo plan y cuota de tokens <strong>hoy mismo</strong>. La fecha de corte se mantiene en{' '}
                            <strong>{manageTenant.next_renewal_date ? new Date(manageTenant.next_renewal_date).toLocaleDateString() : 'fecha vigente'}</strong>{' '}
                            sin perder los días ya pagados del ciclo en curso.
                          </div>
                        </div>
                      </label>

                      {/* Opción 2: Nuevo Ciclo desde Hoy */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          planApplicationMode === 'immediate_reset'
                            ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="planApplicationMode"
                          value="immediate_reset"
                          checked={planApplicationMode === 'immediate_reset'}
                          onChange={() => setPlanApplicationMode('immediate_reset')}
                          className="mt-0.5 text-indigo-600"
                        />
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            Nuevo Ciclo desde Hoy (Reiniciar período)
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Aplica el plan hoy y resetea el ciclo de facturación. La nueva fecha de corte será calculada desde hoy (+{plans.find(p => p.plan_id === assignPlanId)?.billing_period_months || 1} mes(es)).
                          </div>
                        </div>
                      </label>

                      {/* Opción 3: Programar para el Próximo Ciclo */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          planApplicationMode === 'next_period'
                            ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="planApplicationMode"
                          value="next_period"
                          checked={planApplicationMode === 'next_period'}
                          onChange={() => setPlanApplicationMode('next_period')}
                          className="mt-0.5 text-indigo-600"
                        />
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            Programar para el Próximo Ciclo (Al vencimiento)
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            El plan actual sigue activo hasta el{' '}
                            <strong>{manageTenant.next_renewal_date ? new Date(manageTenant.next_renewal_date).toLocaleDateString() : 'vencimiento'}</strong>. El nuevo plan se guardará en la cola de renovación y se activará automáticamente al vencer.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Checkbox condicional para actualizar períodos en cola si el cambio es inmediato */}
                  {planApplicationMode !== 'next_period' && (
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={updateQueuedPlans}
                          onChange={e => setUpdateQueuedPlans(e.target.checked)}
                          className="rounded text-indigo-600 w-4 h-4"
                        />
                        <span>Actualizar también los períodos ya encolados al nuevo plan</span>
                      </label>
                    </div>
                  )}

                  {/* Consumo Excedente */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="assignAllowExtra"
                      checked={assignAllowExtra}
                      onChange={e => setAssignAllowExtra(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    <label htmlFor="assignAllowExtra" className="text-xs font-medium text-slate-700 cursor-pointer">
                      Permitir consumo de tokens excedente (Sobrefacturación autorizada)
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <Button
                      variant="secondary"
                      onClick={() => setManageTenant(null)}
                      className="!py-2 !px-4 !text-sm !font-medium !normal-case !tracking-normal"
                    >
                      Cerrar
                    </Button>
                    <Button
                      type="submit"
                      variant="indigo"
                      loading={submitting}
                      className="!py-2 !px-4 !text-sm !font-semibold !normal-case !tracking-normal flex items-center gap-1.5"
                    >
                      Aplicar Plan
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB 3: COLA DE RENOVACIÓN */}
              {manageActiveTab === 'queue' && (
                <div className="space-y-4">
                  {/* Tarjetas de Cobertura y Métricas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Corte Actual</div>
                      <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        {manageTenant.next_renewal_date 
                          ? new Date(manageTenant.next_renewal_date).toLocaleDateString()
                          : 'Sin fecha'}
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl">
                      <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Períodos en Cola</div>
                      <div className="text-sm font-bold text-amber-900 mt-1 flex items-center gap-1.5">
                        <Layers size={14} className="text-amber-600" />
                        {queueData?.total_queued_periods || 0} período(s) ({queueData?.total_queued_months || 0} m.)
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl">
                      <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Cobertura Proyectada</div>
                      <div className="text-sm font-bold text-emerald-900 mt-1 flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-600" />
                        {queueData?.coverage_until 
                          ? new Date(queueData.coverage_until).toLocaleDateString()
                          : (manageTenant.next_renewal_date ? new Date(manageTenant.next_renewal_date).toLocaleDateString() : 'N/A')}
                      </div>
                    </div>
                  </div>

                  {/* Listado de Períodos en Cola */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Clock size={14} />
                        Secuencia de Períodos Encolados
                      </h4>
                      <Button
                        variant="ghost"
                        onClick={() => fetchTenantQueue(manageTenant.id)}
                        title="Recargar cola"
                        className="!text-xs text-indigo-600 hover:!text-indigo-800 flex items-center gap-1 font-medium !p-1"
                      >
                        <RefreshCw size={12} className={queueLoading ? 'animate-spin' : ''} />
                        Refrescar
                      </Button>
                    </div>

                    {queueLoading ? (
                      <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2 bg-slate-50 rounded-xl border border-slate-100">
                        <RefreshCw size={14} className="animate-spin text-amber-500" />
                        Calculando proyecciones de cola...
                      </div>
                    ) : !queueData?.items || queueData.items.length === 0 ? (
                      <div className="p-5 text-center bg-slate-50 rounded-xl border border-slate-200/70 text-slate-500 text-xs space-y-1">
                        <div className="font-semibold text-slate-700">No hay renovaciones en cola programadas</div>
                        <p className="text-slate-400">
                          Agrega períodos prepagados para asegurar la continuidad del servicio al vencer el corte actual.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {queueData.items.map((item) => (
                          <div 
                            key={item.queue_id}
                            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-colors flex items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                                #{item.queue_position}
                              </span>
                              <div>
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                  {item.plan_name}
                                  <span className="text-[10px] text-indigo-600 bg-indigo-50 font-mono px-1.5 py-0.5 rounded">
                                    {item.tokens_limit.toLocaleString()} tokens
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {item.billing_period_months} mes(es) • ${item.price}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                  <span>{new Date(item.projected_start_date).toLocaleDateString()}</span>
                                  <ArrowRight size={10} className="text-slate-400" />
                                  <span className="text-slate-700 font-semibold">{new Date(item.projected_end_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="ghost-danger"
                              onClick={() => handleRemoveQueueItem(item)}
                              title="Cancelar este período de la cola"
                              className="!p-1.5 text-slate-400 hover:!text-red-600 hover:!bg-red-50 shrink-0"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Formulario para Encolar Nuevos Períodos */}
                  <div className="pt-3 border-t border-slate-100 bg-slate-50/60 p-4 rounded-xl border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                      <Plus size={14} className="text-indigo-600" />
                      Encolar Nuevos Períodos Prepagados
                    </h4>

                    <form onSubmit={handleQueueSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="queuePlanId" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Plan a Encolar
                          </label>
                          <Select
                            inputId="queuePlanId"
                            value={planOptions.find(opt => opt.value === queuePlanId)}
                            onChange={(selected: any) => selected && setQueuePlanId(Number(selected.value))}
                            options={planOptions}
                            isSearchable={false}
                            placeholder="Seleccione un plan a encolar..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Vigencia por Período
                          </label>
                          <div className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 flex items-center justify-between min-h-[54px]">
                            <span>
                              {plans.find(p => p.plan_id === queuePlanId)?.billing_period_months || 1} mes(es)
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/70">
                              {(plans.find(p => p.plan_id === queuePlanId)?.billing_period_months || 1) === 12
                                ? 'Ciclo Anual'
                                : (plans.find(p => p.plan_id === queuePlanId)?.billing_period_months || 1) === 1
                                ? 'Ciclo Mensual'
                                : `Ciclo ${(plans.find(p => p.plan_id === queuePlanId)?.billing_period_months || 1)}m`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Cantidad de Períodos a Encolar (Lote)
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 6, 12].map(num => (
                            <Button
                              key={num}
                              variant="ghost"
                              type="button"
                              onClick={() => setQueuePeriodsCount(num)}
                              className={`!px-3 !py-1.5 !text-xs !font-semibold !rounded-lg border transition-all ${
                                queuePeriodsCount === num
                                  ? '!bg-indigo-600 !text-white !border-indigo-600 shadow-xs'
                                  : '!bg-white !text-slate-700 !border-slate-200 hover:!border-slate-300'
                              }`}
                            >
                              {num} {num === 1 ? 'período' : 'períodos'}
                            </Button>
                          ))}
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={queuePeriodsCount}
                            onChange={e => setQueuePeriodsCount(Math.max(1, Number(e.target.value)))}
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-indigo-500 bg-white"
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Total a respaldar: <strong>{(plans.find(p => p.plan_id === queuePlanId)?.billing_period_months || 1) * queuePeriodsCount} meses adicionales</strong> en {queuePeriodsCount} ciclo(s).
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                        <Button
                          variant="secondary"
                          onClick={() => setManageTenant(null)}
                          className="!py-2 !px-4 !text-sm !font-medium !normal-case !tracking-normal"
                        >
                          Cerrar
                        </Button>
                        <Button
                          type="submit"
                          variant="indigo"
                          loading={queueSubmitting}
                          className="!py-2 !px-4 !text-sm !font-semibold !normal-case !tracking-normal !bg-amber-600 hover:!bg-amber-700 !shadow-amber-500/20 flex items-center gap-1.5"
                        >
                          Encolar Renovación
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Notificación Estándar Compartido */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={notification.onConfirm || hideNotification}
        onCancel={notification.onCancel || hideNotification}
      />
    </div>
  );
};

export default TenantsSection;
