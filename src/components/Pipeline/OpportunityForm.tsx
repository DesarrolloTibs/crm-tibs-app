import React, { useState, useEffect, useMemo } from 'react';
import type { Opportunity} from '../../core/models/Opportunity';
import { OpportunityStage, Currency, BusinessLine, DeliveryType, Licensing } from '../../core/models/Opportunity';
import Select, { type SingleValue } from 'react-select';
import type { Client } from '../../core/models/Client';
import { getClients } from '../../services/clientsService';
import { getUsers } from '../../services/usersService'; // Importar getUsers
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../core/models/User';


interface Props {
  initialData?: Opportunity;
  onSubmit: (opportunity: Partial<Opportunity>) => void;
  onCancel: () => void;
}

// Definir el tipo para las opciones del selector
interface SelectOption {
  value: string;
  label: string;
  isDisabled?: boolean;
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
        // getClients ahora devuelve todos los clientes (activos e inactivos)
        const allClients = await getClients();
        setClients(allClients);
      } catch (error) {
        console.error("Error fetching clients:", error);
        // Opcional: Mostrar una alerta al usuario
      }
    };
    fetchClients();
  }, []); // No necesita dependencias, se carga una vez.
  
  useEffect(() => {
    const fetchExecutives = async () => {
      if (isAdmin) {
        try {
          // getUsers ahora devuelve todos los usuarios (activos e inactivos)
          const allUsers = await getUsers();
          setExecutives(allUsers.filter(u => u.role === 'executive')); // Filtrar solo ejecutivos
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
    label: `${client.nombre} ${client.apellido} (${client.empresa}) ${!client.estatus ? '(Inactivo)' : ''}`,
    // Deshabilita la opción si el cliente está inactivo, a menos que ya esté seleccionado en la oportunidad que se edita.
    isDisabled: !client.estatus && client.id !== initialData?.cliente_id,
  })), [clients, initialData?.cliente_id]);

  const handleClientChange = (selectedOption: SingleValue<SelectOption>) => {
    const clientId = selectedOption ? selectedOption.value : ''; // Asegurarse de que el valor no sea undefined
    const selectedClient = clients.find(c => c.id === clientId);
    setOpportunity({
      ...opportunity,
      cliente_id: clientId,
      empresa: selectedClient ? selectedClient.empresa : '',
    });
  };

  const executiveOptions: SelectOption[] = useMemo(() => executives.map(exec => ({
    value: exec.id!,
    label: `${exec.email} ${!exec.isActive ? '(Inactivo)' : ''}`, // Añadir (Inactivo) si el ejecutivo no está activo
    // Deshabilita la opción si el ejecutivo está inactivo, a menos que ya esté seleccionado en la oportunidad que se edita.
    isDisabled: !exec.isActive && exec.id !== initialData?.ejecutivo_id,
  })), [executives, initialData?.ejecutivo_id]); // Añadir initialData?.ejecutivo_id a las dependencias

  const handleExecutiveChange = (selectedOption: SingleValue<SelectOption>) => {
    setOpportunity({
      ...opportunity,
      ejecutivo_id: selectedOption ? selectedOption.value : '',
    });
  };

  // Encuentra el objeto de opción completo para el valor actual
  const selectedClientValue = clientOptions.find(option => option.value === opportunity.cliente_id);
  // Encuentra el objeto de opción completo para el valor actual del ejecutivo
  const selectedExecutiveValue = executiveOptions.find(option => option.value === opportunity.ejecutivo_id);

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
    <form onSubmit={handleSubmit} className="space-y-8 p-2">
      <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Editar' : 'Nueva'} Oportunidad</h2>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Datos del Proyecto</legend>
        
        <div>
          <label htmlFor="nombre_proyecto" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto</label>
          <input id="nombre_proyecto" name="nombre_proyecto" value={opportunity.nombre_proyecto} onChange={handleChange} placeholder="Ej: Implementación de CRM para Acme Corp" required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <Select inputId="cliente_id" name="cliente_id" options={clientOptions} value={selectedClientValue} onChange={handleClientChange} placeholder="-- Seleccione un Cliente --" isClearable isSearchable required />
          </div>
          {isAdmin && (
            <div>
              <label htmlFor="ejecutivo_id" className="block text-sm font-medium text-gray-700 mb-1">Ejecutivo Asignado</label>
              <Select inputId="ejecutivo_id" name="ejecutivo_id" options={executiveOptions} value={selectedExecutiveValue} onChange={handleExecutiveChange} placeholder="-- Asignar a un Ejecutivo --" isClearable isSearchable required />
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Detalles Financieros</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="monto_licenciamiento" className="block text-sm font-medium text-gray-700 mb-1">Monto Licenciamiento</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input id="monto_licenciamiento" type="number" name="monto_licenciamiento" value={opportunity.monto_licenciamiento} onChange={handleChange} placeholder="0.00" step="0.01" className="w-full border rounded pl-7 pr-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label htmlFor="monto_servicios" className="block text-sm font-medium text-gray-700 mb-1">Monto Servicios</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input id="monto_servicios" type="number" name="monto_servicios" value={opportunity.monto_servicios} onChange={handleChange} placeholder="0.00" step="0.01" className="w-full border rounded pl-7 pr-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label htmlFor="moneda" className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select id="moneda" name="moneda" value={opportunity.moneda} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
              {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Clasificación</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="etapa" className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
            <select id="etapa" name="etapa" value={opportunity.etapa} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
              {Object.values(OpportunityStage).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="linea_negocio" className="block text-sm font-medium text-gray-700 mb-1">Línea de Negocio</label>
            <select id="linea_negocio" name="linea_negocio" value={opportunity.linea_negocio} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
              {Object.values(BusinessLine).map(bl => <option key={bl} value={bl}>{bl}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="tipo_entrega" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Entrega</label>
            <select id="tipo_entrega" name="tipo_entrega" value={opportunity.tipo_entrega} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
              {Object.values(DeliveryType).map(dt => <option key={dt} value={dt}>{dt}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="licenciamiento" className="block text-sm font-medium text-gray-700 mb-1">Licenciamiento</label>
            <select id="licenciamiento" name="licenciamiento" value={opportunity.licenciamiento} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">N/A</option>
              {Object.values(Licensing).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
          Cancelar
        </button>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Guardar
        </button>
      </div>
    </form>
  );
};

export default OpportunityForm;
