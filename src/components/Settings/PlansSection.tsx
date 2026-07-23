import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { getPlans, createPlan, updatePlan, deletePlan } from '../../services/plansService';
import type { Plan } from '../../services/plansService';


const PlansSection: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [tokensLimit, setTokensLimit] = useState<number>(100000);
  const [billingMonths, setBillingMonths] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await getPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar planes:', err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setPlanName('');
    setPrice(0);
    setTokensLimit(100000);
    setBillingMonths(1);
    setShowModal(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanName(plan.plan_name);
    setPrice(plan.price);
    setTokensLimit(plan.tokens_limit);
    setBillingMonths(plan.billing_period_months);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.plan_id, {
          plan_name: planName,
          price,
          tokens_limit: tokensLimit,
          billing_period_months: billingMonths,
        });
        Swal.fire('Plan Actualizado', 'El plan ha sido modificado exitosamente.', 'success');
      } else {
        await createPlan({
          plan_name: planName,
          price,
          tokens_limit: tokensLimit,
          billing_period_months: billingMonths,
        });
        Swal.fire('Plan Creado', 'El plan ha sido creado exitosamente.', 'success');
      }
      setShowModal(false);
      await loadPlans();
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    const res = await Swal.fire({
      title: `¿Desactivar ${plan.plan_name}?`,
      text: 'El plan pasará a estado inactivo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });

    if (res.isConfirmed) {
      try {
        await deletePlan(plan.plan_id);
        await loadPlans();
        Swal.fire('Desactivado', 'El plan ha sido desactivado.', 'success');
      } catch (err: any) {
        Swal.fire('Error', err.response?.data?.message || err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-indigo-600" size={24} />
            Catálogo Global de Planes de Suscripción
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Define el precio, límite estricto de consumo de tokens y período de facturación de cada nivel de servicio.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
        >
          <Plus size={18} />
          Nuevo Plan
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Cargando catálogo de planes...</div>
        ) : !Array.isArray(plans) || plans.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No hay planes registrados aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Precio USD</th>
                  <th className="py-3.5 px-4">Límite de Tokens</th>
                  <th className="py-3.5 px-4">Período</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(plans || []).map(p => (

                  <tr key={p.plan_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{p.plan_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">${Number(p.price).toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono text-indigo-600 font-semibold">
                      {p.tokens_limit.toLocaleString()} tokens
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{p.billing_period_months} mes(es)</td>
                    <td className="py-3.5 px-4">
                      {p.blnstatus ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <CheckCircle size={12} /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          <XCircle size={12} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar plan"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Desactivar plan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              {editingPlan ? `Editar Plan '${editingPlan.plan_name}'` : 'Crear Nuevo Plan'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Plan</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Plan Profesional"
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Precio ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Límite de Tokens por Período</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={tokensLimit}
                  onChange={e => setTokensLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Período de Facturación (Meses)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={billingMonths}
                  onChange={e => setBillingMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansSection;
