import React, { useState, useEffect } from 'react';
import type { Opportunity} from '../../core/models/Opportunity';
import { OpportunityStage, Currency, BusinessLine, DeliveryType, Licensing } from '../../core/models/Opportunity';

interface Props {
  initialData?: Opportunity;
  onSubmit: (opportunity: Opportunity) => void;
  onCancel: () => void;
}

const OpportunityForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
  const [opportunity, setOpportunity] = useState<Partial<Opportunity>>(
    initialData || {
      nombre_proyecto: '',
      cliente_id: '', // Este campo necesitará un selector de clientes
      empresa: '',
      ejecutivo_id: '', // Este campo necesitará un selector de ejecutivos
      etapa: 'Nuevo',
      monto_licenciamiento: 0,
      monto_servicios: 0,
      moneda: 'USD',
      linea_negocio: 'Datos',
      tipo_entrega: 'Proyecto',
    }
  );

  useEffect(() => {
    const licenciamiento = Number(opportunity.monto_licenciamiento) || 0;
    const servicios = Number(opportunity.monto_servicios) || 0;
    const total = licenciamiento + servicios;
    setOpportunity(o => ({ ...o, monto_total: total }));
  }, [opportunity.monto_licenciamiento, opportunity.monto_servicios]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumberInput = ['monto_licenciamiento', 'monto_servicios'].includes(name);
    const parsedValue = isNumberInput ? (value === '' ? '' : parseFloat(value)) : value;
    setOpportunity({ ...opportunity, [name]: parsedValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Añadir validación más robusta
    if (!opportunity.nombre_proyecto || !opportunity.cliente_id || !opportunity.ejecutivo_id) {
        alert('Por favor, completa los campos requeridos.');
        return;
    }
    const finalOpportunity = {
      ...opportunity,
      monto_licenciamiento: Number(opportunity.monto_licenciamiento) || 0,
      monto_servicios: Number(opportunity.monto_servicios) || 0,
    };
    onSubmit(finalOpportunity as Opportunity);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">{initialData ? 'Editar' : 'Nueva'} Oportunidad</h2>
      
      <input name="nombre_proyecto" value={opportunity.nombre_proyecto} onChange={handleChange} placeholder="Nombre del Proyecto" required className="w-full border rounded px-3 py-2" />
      
      {/* TODO: Reemplazar con un selector de Clientes y Ejecutivos */}
      <input name="empresa" value={opportunity.empresa} onChange={handleChange} placeholder="Empresa (Cliente)" required className="w-full border rounded px-3 py-2" />
      <input name="ejecutivo_id" value={opportunity.ejecutivo_id} onChange={handleChange} placeholder="ID Ejecutivo" required className="w-full border rounded px-3 py-2" />
      <input name="cliente_id" value={opportunity.cliente_id} onChange={handleChange} placeholder="ID Cliente" required className="w-full border rounded px-3 py-2" />

      <div className="grid grid-cols-2 gap-4">
        <input type="number" name="monto_licenciamiento" value={opportunity.monto_licenciamiento} onChange={handleChange} placeholder="Monto Licenciamiento" className="w-full border rounded px-3 py-2" />
        <input type="number" name="monto_servicios" value={opportunity.monto_servicios} onChange={handleChange} placeholder="Monto Servicios" className="w-full border rounded px-3 py-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <select name="moneda" value={opportunity.moneda} onChange={handleChange} className="w-full border rounded px-3 py-2">
          {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="etapa" value={opportunity.etapa} onChange={handleChange} className="w-full border rounded px-3 py-2">
          {Object.values(OpportunityStage).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <select name="linea_negocio" value={opportunity.linea_negocio} onChange={handleChange} className="w-full border rounded px-3 py-2">
          {Object.values(BusinessLine).map(bl => <option key={bl} value={bl}>{bl}</option>)}
        </select>
        <select name="tipo_entrega" value={opportunity.tipo_entrega} onChange={handleChange} className="w-full border rounded px-3 py-2">
          {Object.values(DeliveryType).map(dt => <option key={dt} value={dt}>{dt}</option>)}
        </select>
      </div>

      <select name="licenciamiento" value={opportunity.licenciamiento} onChange={handleChange} className="w-full border rounded px-3 py-2">
        <option value="">N/A</option>
        {Object.values(Licensing).map(l => <option key={l} value={l}>{l}</option>)}
      </select>

      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
          Cancelar
        </button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Guardar
        </button>
      </div>
    </form>
  );
};

export default OpportunityForm;
