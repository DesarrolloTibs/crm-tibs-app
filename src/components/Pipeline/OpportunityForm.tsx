import React, { useState, useEffect, useMemo } from 'react';
import type { Opportunity} from '../../core/models/Opportunity';
import { OpportunityStage, Currency, BusinessLine, DeliveryType, Licensing } from '../../core/models/Opportunity';
import Select, { type SingleValue, type ActionMeta } from 'react-select';
import type { Client } from '../../core/models/Client';
import { getActiveClients } from '../../services/clientsService';


import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../core/models/User';
import { getActiveUsers } from '../../services/usersService';


interface Props {
  initialData?: Opportunity;
  onSubmit: (opportunity: Partial<Opportunity>) => void;
  onCancel: () => void;
}

// Definir el tipo para las opciones del selector
interface SelectOption {
  value: string | undefined;
  label: string;
}

const OpportunityForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
  const { user, isAdmin, isEjecutivo } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
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
    const fetchClients = async () => {
      try {
        const activeClients = await getActiveClients();
        setClients(activeClients);
      } catch (error) {
        console.error("Error fetching clients:", error);
        // Opcional: Mostrar una alerta al usuario
      }
    };
    fetchClients();
  }, []);
  
  useEffect(() => {
    const fetchExecutives = async () => {
      if (isAdmin) {
        try {
          const activeUsers = await getActiveUsers();
          setExecutives(activeUsers.filter(u => u.role === 'executive'));
        } catch (error) {
          console.error("Error fetching executives:", error);
        }
      }
    };
    fetchExecutives();
  }, [isAdmin]);

  useEffect(() => {
    // Si el usuario es un ejecutivo y se está creando una nueva oportunidad,
    // asignarle su ID por defecto.
    if (isEjecutivo && user && !initialData) {
      setOpportunity(o => ({ ...o, ejecutivo_id: user.sub }));
    }
  }, [user, isEjecutivo, initialData]);

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

  const clientOptions = useMemo(() => clients.map(client => ({
    value: client.id!,
    label: `${client.nombre} ${client.apellido} (${client.empresa})`
  })), [clients]);

  const handleClientChange = (selectedOption: SingleValue<{ value: string; label: string }>) => {
    const clientId = selectedOption ? selectedOption.value : '';
    const selectedClient = clients.find(c => c.id === clientId);
    setOpportunity({
      ...opportunity,
      cliente_id: clientId,
      empresa: selectedClient ? selectedClient.empresa : '',
    });
  };

  const executiveOptions: SelectOption[] = useMemo(() => executives.map(exec => ({
    value: exec.id,
    label: exec.email
  })), [executives]);

  const handleExecutiveChange = (selectedOption: SingleValue<SelectOption>) => {
    setOpportunity({
      ...opportunity,
      ejecutivo_id: selectedOption ? selectedOption.value || '' : '',
    });
  };

  // Encuentra el objeto de opción completo para el valor actual
  const selectedClientValue = clientOptions.find(option => option.value === opportunity.cliente_id);

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
    onSubmit(finalOpportunity);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">{initialData ? 'Editar' : 'Nueva'} Oportunidad</h2>
      
      <input name="nombre_proyecto" value={opportunity.nombre_proyecto} onChange={handleChange} placeholder="Nombre del Proyecto" required className="w-full border rounded px-3 py-2" />
      
      <Select
        name="cliente_id"
        options={clientOptions}
        value={selectedClientValue}
        onChange={handleClientChange}
        placeholder="-- Seleccione un Cliente --"
        isClearable
        isSearchable
        required
      />
      {isAdmin && (
        <Select
          name="ejecutivo_id"
          options={executiveOptions}
          value={executiveOptions.find(option => option.value === opportunity.ejecutivo_id)}
          onChange={handleExecutiveChange}
          placeholder="-- Asignar a un Ejecutivo --"
          isClearable
          isSearchable
          required
        />
      )}
      {/* Para el ejecutivo, el campo está oculto pero su valor se asigna en el useEffect */}

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
