import React, { useState, useEffect, useMemo } from 'react';
import type { Opportunity, CurrencyType } from '../../core/models/Opportunity';
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
  const [editingField, setEditingField] = useState<string | null>(null);
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
      tipoCambio: 0,
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

  const formatCurrency = (value: number | undefined | string) => {
    if (value === undefined || value === null || value === '') return '';
    const numberValue = Number(value);
    if (isNaN(numberValue)) return '';
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numberValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setEditingField(e.target.name);
  };

  const handleBlur = () => {
    // Al salir del campo, parseamos el valor a un número con 2 decimales para evitar problemas de formato.
    if (editingField) {
      const currentValue = opportunity[editingField as keyof Opportunity] as string;
      const numericValue = parseFloat(currentValue);
      // Redondea a 2 decimales y lo guarda como número
      const roundedValue = isNaN(numericValue) ? 0 : Number(numericValue.toFixed(2));
      setOpportunity(prev => ({ ...prev, [editingField]: roundedValue }));
    }
    setEditingField(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Lógica especial para el cambio de moneda
    if (name === 'moneda') {
      setOpportunity(prev => {
        // Si la moneda es MXN, el tipo de cambio es 0.
        // Si es USD, se mantiene o se resetea a 1, asegurando que tenga 2 decimales.
        const newTipoCambio = value === 'MXN' ? 0 : (prev.tipoCambio || 1);
        return {
          ...prev,
          moneda: value as CurrencyType,
          tipoCambio: Number(newTipoCambio.toFixed(2)),
        };
      });
    } else {
      setOpportunity({ ...opportunity, [name]: value });
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Limpiamos el valor para permitir solo números y un punto decimal.
    const sanitizedValue = value.replace(/[^0-9.]/g, '');

    // Para evitar que se guarden valores no numéricos, parseamos inmediatamente.
    const numericValue = parseFloat(sanitizedValue);

    // Guardamos el valor numérico o un string vacío si la entrada no es válida.
    setOpportunity({ ...opportunity, [name]: isNaN(numericValue) ? '' : sanitizedValue });
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
    // Aseguramos que los valores monetarios se envíen como números
    const finalOpportunity = {
      ...opportunity,
      monto_licenciamiento: Number(opportunity.monto_licenciamiento) || 0,
      monto_servicios: Number(opportunity.monto_servicios) || 0,
      tipoCambio: Number(opportunity.tipoCambio) || 0,
    };
    onSubmit(finalOpportunity);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-2">
      {/* <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Editar' : 'Nueva'} Oportunidad</h2> */}

      <fieldset className="space-y-6">
        <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Datos del Proyecto</legend>
        
        <div>
          <label htmlFor="nombre_proyecto" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto</label>
          <input id="nombre_proyecto" name="nombre_proyecto" value={opportunity.nombre_proyecto} onChange={handleChange} placeholder="Ej: Implementación de CRM para Acme Corp" required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <fieldset className="space-y-6">
        <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Detalles Financieros</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="monto_licenciamiento" className="block text-sm font-medium text-gray-700 mb-1">Monto Licenciamiento</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input id="monto_licenciamiento" type="text" name="monto_licenciamiento" value={editingField === 'monto_licenciamiento' ? opportunity.monto_licenciamiento || '' : formatCurrency(opportunity.monto_licenciamiento)} onFocus={handleFocus} onBlur={handleBlur} onChange={handleCurrencyChange} placeholder="0.00" className="w-full border rounded pl-7 pr-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-right" />
            </div>
          </div>
          <div>
            <label htmlFor="monto_servicios" className="block text-sm font-medium text-gray-700 mb-1">Monto Servicios</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input id="monto_servicios" type="text" name="monto_servicios" value={editingField === 'monto_servicios' ? opportunity.monto_servicios || '' : formatCurrency(opportunity.monto_servicios)} onFocus={handleFocus} onBlur={handleBlur} onChange={handleCurrencyChange} placeholder="0.00" className="w-full border rounded pl-7 pr-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-right" />
            </div>
          </div>
          <div>
            <label htmlFor="moneda" className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select id="moneda" name="moneda" value={opportunity.moneda} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
              {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {opportunity.moneda === 'USD' && (
            <div className="animate-fade-in">
              <label htmlFor="tipoCambio" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cambio (USD a MXN)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input id="tipoCambio" type="text" name="tipoCambio" value={editingField === 'tipoCambio' ? opportunity.tipoCambio || '' : formatCurrency(opportunity.tipoCambio)} onFocus={handleFocus} onBlur={handleBlur} onChange={handleCurrencyChange} placeholder="17.50" required={opportunity.moneda === 'USD'} className="w-full border rounded pl-7 pr-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-right" />
              </div>
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Clasificación</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
