import React, { useState, useEffect } from 'react';
import { Building2, Plus, Calendar, ShieldAlert, CheckCircle, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { getTenants, provisionTenant, updateTenantPlan, enqueueTenantRenewal, updateAllowExtra, updateTenant, deleteTenant } from '../../services/tenantsService';
import { getPlans } from '../../services/plansService';
import type { Plan } from '../../services/plansService';
import { useConfigStore } from '../../store/useConfigStore';
import type { TenantPlanInfo } from '../../store/useConfigStore';

const TenantsSection: React.FC = () => {
  const { tenants, setTenants } = useConfigStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);

  // Modales
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<TenantPlanInfo | null>(null);
  const [showPlanModal, setShowPlanModal] = useState<TenantPlanInfo | null>(null);
  const [showQueueModal, setShowQueueModal] = useState<TenantPlanInfo | null>(null);

  // Form provisión
  const [tenantName, setTenantName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>(undefined);
  const [billingMonths] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Form edición
  const [editTenantName, setEditTenantName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editAllowExtra, setEditAllowExtra] = useState(false);



  // Form asignación plan
  const [assignPlanId, setAssignPlanId] = useState<number>(1);
  const [assignMonths, setAssignMonths] = useState<number>(1);
  const [assignAllowExtra, setAssignAllowExtra] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenantsData, plansData] = await Promise.all([getTenants(), getPlans()]);
      const validTenants = Array.isArray(tenantsData) ? tenantsData : [];
      const validPlans = Array.isArray(plansData) ? plansData : [];
      setTenants(validTenants);
      setPlans(validPlans);
      if (validPlans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(validPlans[0].plan_id);
        setAssignPlanId(validPlans[0].plan_id);
      }
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

      Swal.fire({
        icon: 'success',
        title: '🎉 Organización Aprovisionada',
        html: `
          <div class="text-left text-sm space-y-2">
            <p><strong>Organización:</strong> ${res.schemaName}</p>
            <p><strong>Usuario Admin:</strong> ${res.adminUsername}</p>
            <p><strong>Email:</strong> ${res.adminEmail}</p>
            <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl font-mono text-amber-900 text-xs">
              <p><strong>Contraseña Temporal Generada:</strong></p>
              <p class="text-base font-bold text-slate-800 mt-1 select-all">${res.tempPassword}</p>
            </div>
            <p class="text-xs text-slate-500 mt-2">Por favor, comparta estas credenciales con el administrador del tenant.</p>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#4f46e5',
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Provisión',
        text: err.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPlanModal) return;
    setSubmitting(true);
    try {
      await updateTenantPlan(showPlanModal.id, assignPlanId, assignMonths, assignAllowExtra);
      setShowPlanModal(null);
      await loadData();
      Swal.fire('Plan Actualizado', 'La suscripción del tenant ha sido actualizada exitosamente.', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQueueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showQueueModal) return;
    setSubmitting(true);
    try {
      await enqueueTenantRenewal(showQueueModal.id, assignPlanId, assignMonths);
      setShowQueueModal(null);
      Swal.fire('Renovación en Cola', 'El período de renovación ha sido agregado a la cola correctamente.', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAllowExtra = async (t: TenantPlanInfo) => {
    try {
      await updateAllowExtra(t.id, !t.allow_extra);
      await loadData();
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || err.message, 'error');
    }
  };

  const handleEditTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setSubmitting(true);
    try {
      await updateTenant(showEditModal.id, {
        name: editTenantName,
        is_active: editIsActive,
        allow_extra: editAllowExtra,
      });
      setShowEditModal(null);
      await loadData();
      Swal.fire('Organización Actualizada', 'Los datos de la organización se actualizaron correctamente.', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTenant = async (t: TenantPlanInfo) => {
    const result = await Swal.fire({
      title: '¿Eliminar Organización?',
      html: `¿Estás seguro de que deseas eliminar la organización <strong>${t.name}</strong> (${t.schema_name})?<br/><br/><span class="text-xs text-red-600 font-semibold">⚠️ ADVERTENCIA: Esta acción eliminará el esquema de base de datos y todos sus datos permanentemente.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar permanentemente',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await deleteTenant(t.id);
        await loadData();
        Swal.fire('Organización Eliminada', `La organización '${t.name}' fue eliminada exitosamente.`, 'success');
      } catch (err: any) {
        Swal.fire('Error', err.response?.data?.message || err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={24} />
            Gestión Centralizada de Organizaciones (Tenants)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Administra suscripciones, provisión atómica de esquemas, colas de renovación y límites de consumo.
          </p>
        </div>

        <button
          onClick={() => setShowProvisionModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
        >
          <Plus size={18} />
          Provisionar Organización
        </button>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Cargando organizaciones...</div>
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
                {(Array.isArray(tenants) ? tenants : []).map(t => (

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

                    <td className="py-3.5 px-4 text-xs font-mono">
                      {t.next_renewal_date ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(t.next_renewal_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleAllowExtra(t)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          t.allow_extra
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {t.allow_extra ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {t.allow_extra ? 'Permitido' : 'Bloqueado'}
                      </button>
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

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setShowEditModal(t);
                          setEditTenantName(t.name);
                          setEditIsActive(t.is_active);
                          setEditAllowExtra(t.allow_extra);
                        }}
                        title="Editar datos de la organización"
                        className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <Pencil size={13} /> Editar
                      </button>
                      <button
                        onClick={() => {
                          setShowPlanModal(t);
                          setAssignPlanId(t.plan_id || (plans[0]?.plan_id ?? 1));
                          setAssignAllowExtra(t.allow_extra);
                        }}
                        title="Asignar o renovar plan"
                        className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        Plan
                      </button>
                      <button
                        onClick={() => {
                          setShowQueueModal(t);
                          setAssignPlanId(t.plan_id || (plans[0]?.plan_id ?? 1));
                        }}
                        title="Agregar renovación a cola"
                        className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        Cola
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(t)}
                        title="Eliminar organización"
                        className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 font-semibold px-2 py-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Provisionar Tenant */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Provisionar Nueva Organización</h3>

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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Plan Inicial</label>
                <select
                  value={selectedPlanId}
                  onChange={e => setSelectedPlanId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  {plans.map(p => (
                    <option key={p.plan_id} value={p.plan_id}>
                      {p.plan_name} - ${p.price} ({p.tokens_limit.toLocaleString()} tokens)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Provisionando...' : 'Crear Esquema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Plan */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Asignar Plan a {showPlanModal.name}</h3>

            <form onSubmit={handleAssignPlanSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Seleccionar Plan</label>
                <select
                  value={assignPlanId}
                  onChange={e => setAssignPlanId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  {plans.map(p => (
                    <option key={p.plan_id} value={p.plan_id}>
                      {p.plan_name} - ${p.price} ({p.tokens_limit.toLocaleString()} tokens)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Meses de Vigencia</label>
                <input
                  type="number"
                  min={1}
                  value={assignMonths}
                  onChange={e => setAssignMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="allowExtra"
                  checked={assignAllowExtra}
                  onChange={e => setAssignAllowExtra(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="allowExtra" className="text-xs font-medium text-slate-700">
                  Permitir consumo de tokens excedente
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cola Renovación */}
      {showQueueModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Agregar a Cola de Renovación</h3>
            <p className="text-xs text-slate-500">
              Agrega un período contratado que se activará automáticamente cuando venza la fecha actual.
            </p>

            <form onSubmit={handleQueueSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Plan a Renovar</label>
                <select
                  value={assignPlanId}
                  onChange={e => setAssignPlanId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  {plans.map(p => (
                    <option key={p.plan_id} value={p.plan_id}>
                      {p.plan_name} - ${p.price} ({p.tokens_limit.toLocaleString()} tokens)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Duración (Meses)</label>
                <input
                  type="number"
                  min={1}
                  value={assignMonths}
                  onChange={e => setAssignMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowQueueModal(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50"
                >
                  Encolar Renovación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Organización */}
      {showEditModal && (

        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Editar Organización</h3>

            <form onSubmit={handleEditTenantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la Organización</label>
                <input
                  type="text"
                  required
                  value={editTenantName}
                  onChange={e => setEditTenantName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Esquema de Base de Datos</label>
                <input
                  type="text"
                  disabled
                  value={showEditModal.schema_name}
                  className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-400 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={e => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  Organización Activa (Permite iniciar sesión a sus usuarios)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={editAllowExtra}
                    onChange={e => setEditAllowExtra(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  Permitir Consumo Excedente de Tokens
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsSection;

