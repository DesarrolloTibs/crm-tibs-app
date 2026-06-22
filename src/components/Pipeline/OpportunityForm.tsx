import React, { useState, useEffect, useMemo } from 'react';
import type { Opportunity, CurrencyType, Stage } from '../../core/models/Opportunity';
import { Currency } from '../../core/models/Opportunity';
import { getActiveCatalogOptions } from '../../services/opportunityCatalogsService';
import type { OpportunityCatalogOption } from '../../core/models/OpportunityCatalog';
import Select, { type SingleValue, type MultiValue } from 'react-select';
import { getActiveStages } from '../../services/pipelinesService';
import { FileText, ChevronDown } from 'lucide-react';
import type { Client } from '../../core/models/Client';
import { getClients, createClient } from '../../services/clientsService';
import { getUsers } from '../../services/usersService'; // Importar getUsers
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../core/models/User';
import ClientForm from '../Client/ClientForm';
import { getCompanies } from '../../services/companiesService';
import type { Company } from '../../core/models/Company';
import type { Product } from '../../core/models/Product';
import { getProducts, downloadProductFile } from '../../services/productsService';
import { getOpportunityLabels } from '../../services/opportunityLabelsService';
import type { OpportunityLabel } from '../../core/models/OpportunityLabel';



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

type OpportunityFormData = Omit<Partial<Opportunity>, 'estimated_closure_date' | 'createdAt'> & {
    estimated_closure_date?: string;
    createdAt?: string;
    contactIds?: string[];
    productIds?: string[];
};

const OpportunityForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
  const { user, isAdmin, isEjecutivo } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const baseUrl = import.meta.env.VITE_BASE_URL || '';
  const [isDocsSectionOpen, setIsDocsSectionOpen] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [opportunityLabels, setOpportunityLabels] = useState<OpportunityLabel[]>([]);
  const [businessLines, setBusinessLines] = useState<OpportunityCatalogOption[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<OpportunityCatalogOption[]>([]);
  const [licensings, setLicensings] = useState<OpportunityCatalogOption[]>([]);

  const getLabelName = (uuid: string, defaultName: string) => {
    const label = opportunityLabels.find(l => l.id === uuid);
    return label && label.strname ? label.strname : defaultName;
  };

  const handleDownloadProductFile = async (productId: string, file: any) => {
    setDownloadingFileId(file.id);
    try {
      const blob = await downloadProductFile(productId, file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar el archivo del producto:", error);
    } finally {
      setDownloadingFileId(null);
    }
  };
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [linkType, setLinkType] = useState<'company' | 'contact'>(
    initialData?.companyId ? 'company' : 'contact'
  );

  const [stages, setStages] = useState<Stage[]>([]);
  const [opportunity, setOpportunity] = useState<OpportunityFormData>(
    initialData && initialData.id ? {
      ...initialData,
      estimated_closure_date: initialData.estimated_closure_date ? new Date(initialData.estimated_closure_date).toISOString().split('T')[0] : '',
      createdAt: initialData.createdAt ? new Date(initialData.createdAt).toISOString().split('T')[0] : '',
      contactIds: initialData.contacts?.map(c => c.id!) || [],
      productIds: initialData.products?.map(p => p.id!) || [],
      linea_negocio_id: initialData.linea_negocio_id || initialData.linea_negocio?.id || '',
      tipo_entrega_id: initialData.tipo_entrega_id || initialData.tipo_entrega?.id || '',
      licenciamiento_id: initialData.licenciamiento_id || initialData.licenciamiento?.id || '',
    } : {
      nombre_proyecto: '',
      description: '',
      cliente_id: '', 
      companyId: '',
      contactIds: [],
      productIds: [],
      empresa: '',
      ejecutivo_id: '', 
      stage_id: initialData?.stage_id || '',
      monto_licenciamiento: 0,
      monto_servicios: 0,
      moneda: 'USD',
      linea_negocio_id: '',
      tipo_entrega_id: '',
      licenciamiento_id: '',
      tipoCambio: 0,
      estimated_closure_date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0], 
    }
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allClients, allCompanies, activeStages, allProducts, allLabels, blOptions, dtOptions, lOptions] = await Promise.all([
          getClients(),
          getCompanies(),
          getActiveStages(),
          getProducts(),
          getOpportunityLabels().catch(err => {
            console.error("Error al obtener etiquetas de oportunidad:", err);
            return [];
          }),
          getActiveCatalogOptions('business-lines').catch(err => {
            console.error("Error al obtener líneas de negocio:", err);
            return [];
          }),
          getActiveCatalogOptions('delivery-types').catch(err => {
            console.error("Error al obtener tipos de entrega:", err);
            return [];
          }),
          getActiveCatalogOptions('licensings').catch(err => {
            console.error("Error al obtener licenciamientos:", err);
            return [];
          }),
        ]);
        setClients(allClients);
        setCompanies(allCompanies.filter(c => c.estatus));
        setStages(activeStages);
        setOpportunityLabels(allLabels);
        setBusinessLines(blOptions);
        setDeliveryTypes(dtOptions);
        setLicensings(lOptions);

        const associatedProductIds = initialData?.products?.map(p => p.id!) || [];
        const filteredProducts = allProducts.filter(p => p.status || associatedProductIds.includes(p.id!));
        setProducts(filteredProducts);

        // Si es creación, pre-seleccionar los valores predeterminados
        if (!initialData || !initialData.id) {
          setOpportunity(prev => {
            const updates: any = {};
            if (!prev.stage_id) {
              const initialStage = activeStages.find(s => s.blninitial) || activeStages[0];
              if (initialStage) updates.stage_id = initialStage.id;
            }
            updates.linea_negocio_id = prev.linea_negocio_id || blOptions[0]?.id || '';
            updates.tipo_entrega_id = prev.tipo_entrega_id || dtOptions[0]?.id || '';
            updates.licenciamiento_id = prev.licenciamiento_id || lOptions[0]?.id || '';
            return { ...prev, ...updates };
          });
        }
      } catch (error) {
        console.error("Error loading form dependencies:", error);
      }
    };
    loadData();
  }, [initialData]); 

  
  useEffect(() => {
    const fetchExecutives = async () => {
      if (isAdmin) {
        try {
          // getUsers ahora devuelve todos los usuarios (activos e inactivos)
          const allUsers = await getUsers();
          setExecutives(allUsers); // Filtrar solo ejecutivos
        } catch (error) {
          console.error("Error fetching executives:", error);
        }
      }
    };
    fetchExecutives();
  }, [isAdmin]);

  useEffect(() => {
    // Si el usuario no es administrador y hay un usuario logueado,
    // y no hay un ejecutivo asignado (en creación o edición de oportunidad sin ejecutivo),
    // asignarle su ID por defecto.
    if (!isAdmin && user && !opportunity.ejecutivo_id) {
      setOpportunity(o => ({ ...o, ejecutivo_id: user.sub }));
    }
  }, [user, isAdmin, opportunity.ejecutivo_id]);

  const productsPriceSum = useMemo(() => {
    if (!opportunity.productIds || opportunity.productIds.length === 0) return 0;
    return products
      .filter(p => opportunity.productIds?.includes(p.id!))
      .reduce((sum, p) => sum + (Number(p.precioBase) || 0), 0);
  }, [opportunity.productIds, products]);

  const convertedProductsPrice = useMemo(() => {
    if (opportunity.moneda === 'USD') {
      const rate = Number(opportunity.tipoCambio) || 0;
      return rate > 0 ? (productsPriceSum / rate) : 0;
    }
    return productsPriceSum;
  }, [opportunity.moneda, opportunity.tipoCambio, productsPriceSum]);

  useEffect(() => {
    const licenciamiento = Number(opportunity.monto_licenciamiento) || 0;
    const servicios = Number(opportunity.monto_servicios) || 0;
    const total = licenciamiento + servicios + convertedProductsPrice;
    setOpportunity(o => ({ ...o, monto_total: total }));
  }, [opportunity.monto_licenciamiento, opportunity.monto_servicios, convertedProductsPrice]);



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
    label: `${client.nombre} ${client.apellido} (${client.company?.nombre || client.empresa || 'Sin empresa'}) ${!client.estatus ? '(Inactivo)' : ''}`,
    isDisabled: !client.estatus && client.id !== initialData?.cliente_id,
  })), [clients, initialData?.cliente_id]);

  const handleClientChange = (selectedOption: SingleValue<SelectOption>) => {
    const clientId = selectedOption ? selectedOption.value : '';
    const selectedClient = clients.find(c => c.id === clientId);
    setOpportunity({
      ...opportunity,
      cliente_id: clientId,
      empresa: selectedClient ? (selectedClient.company?.nombre || selectedClient.empresa || '') : '',
      companyId: selectedClient ? (selectedClient.companyId || null) : null,
    });
  };

  const companyOptions = useMemo(() => companies.map(c => ({
    value: c.id!,
    label: c.nombre,
  })), [companies]);

  const selectedCompanyValue = companyOptions.find(option => option.value === opportunity.companyId);

  const handleCompanyChange = (selectedOption: SingleValue<SelectOption>) => {
    const companyId = selectedOption ? selectedOption.value : '';
    const selectedComp = companies.find(c => c.id === companyId);
    setOpportunity(prev => ({
      ...prev,
      companyId: companyId,
      empresa: selectedComp ? selectedComp.nombre : '',
      contactIds: [],
    }));
  };

  const companyContactOptions = useMemo<SelectOption[]>(() => {
    if (!opportunity.companyId) return [];
    const list = clients
      .filter(client => client.companyId === opportunity.companyId || !client.companyId)
      .map(client => ({
        value: client.id!,
        label: `${client.nombre} ${client.apellido} (${client.company?.nombre || client.empresa || 'Sin empresa'}) ${!client.estatus ? '(Inactivo)' : ''}`,
        isDisabled: !client.estatus && !opportunity.contactIds?.includes(client.id!),
      }));
    if (list.length > 0) {
      return [{ value: 'all', label: 'Seleccionar todos' }, ...list];
    }
    return list;
  }, [clients, opportunity.companyId, opportunity.contactIds]);

  const selectedContactsValue = companyContactOptions.filter(option => 
    option.value !== 'all' && opportunity.contactIds?.includes(option.value)
  );

  const handleContactsChange = (selectedOptions: MultiValue<SelectOption>) => {
    const ids = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    if (ids.includes('all')) {
      const realContactIds = companyContactOptions
        .filter(opt => opt.value !== 'all' && !opt.isDisabled)
        .map(opt => opt.value);
      const allSelected = realContactIds.every(id => opportunity.contactIds?.includes(id));
      setOpportunity(prev => ({
        ...prev,
        contactIds: allSelected ? [] : realContactIds,
      }));
    } else {
      setOpportunity(prev => ({
        ...prev,
        contactIds: ids,
      }));
    }
  };

  const executiveOptions: SelectOption[] = useMemo(() => executives.map(exec => ({
    value: exec.id!,
    label: `${exec.username} ${!exec.isActive ? '(Inactivo)' : ''}`,
    isDisabled: !exec.isActive && exec.id !== initialData?.ejecutivo_id,
  })), [executives, initialData?.ejecutivo_id]);

  const handleExecutiveChange = (selectedOption: SingleValue<SelectOption>) => {
    setOpportunity({
      ...opportunity,
      ejecutivo_id: selectedOption ? selectedOption.value : '',
    });
  };

  const productOptions = useMemo(() => products.map(product => ({
    value: product.id!,
    label: `${product.nombre} (${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.precioBase)})`,
  })), [products]);

  const selectedProductsValue = productOptions.filter(option =>
    opportunity.productIds?.includes(option.value)
  );

  const handleProductsChange = (selectedOptions: MultiValue<SelectOption>) => {
    const ids = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setOpportunity(prev => ({
      ...prev,
      productIds: ids,
    }));
  };

  const selectedClientValue = clientOptions.find(option => option.value === opportunity.cliente_id);
  const selectedExecutiveValue = executiveOptions.find(option => option.value === opportunity.ejecutivo_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Si no es administrador y no tiene ejecutivo asignado, usar el id del usuario actual como fallback
    let finalEjecutivoId = opportunity.ejecutivo_id;
    if (!isAdmin && !finalEjecutivoId && user) {
      finalEjecutivoId = user.sub;
    }

    if (!opportunity.nombre_proyecto || !opportunity.description?.trim() || !finalEjecutivoId) {
        alert('Por favor, completa los campos requeridos.');
        return;
    }
    if (linkType === 'company' && !opportunity.companyId) {
        alert('Por favor, seleccione una Empresa.');
        return;
    }
    if (linkType === 'contact' && !opportunity.cliente_id) {
        alert('Por favor, seleccione un Contacto.');
        return;
    }

    const { 
      estimated_closure_date, 
      createdAt, 
      products, 
      contacts, 
      cliente, 
      company, 
      ejecutivo, 
      stage, 
      interactions, 
      reminders, 
      files, 
      archived,
      proposalDocumentPath,
      linea_negocio,
      tipo_entrega,
      licenciamiento,
      ...rest 
    } = opportunity;

    let closureDate: Date | undefined = undefined;
    if (estimated_closure_date) {
        const dateString = estimated_closure_date as unknown as string;
        const parts = dateString.split('-');
        closureDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12);
    }

    let creationDate: Date | undefined = undefined;
    if (createdAt) {
      const dateString = createdAt as unknown as string;
      const parts = dateString.split('-');
      creationDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12);
    }

    const finalOpportunity: Partial<Opportunity> = {
      ...rest,
      ejecutivo_id: finalEjecutivoId,
      monto_licenciamiento: Number(opportunity.monto_licenciamiento) || 0,
      monto_servicios: Number(opportunity.monto_servicios) || 0,
      tipoCambio: Number(opportunity.tipoCambio) || 0,
      estimated_closure_date: closureDate,
      createdAt: creationDate,
      productIds: opportunity.productIds || [],
    };

    if (linkType === 'company') {
      finalOpportunity.cliente_id = null;
      // rest of values (companyId, contactIds, empresa) are already in rest
    } else {
      finalOpportunity.companyId = null;
      finalOpportunity.contactIds = opportunity.cliente_id ? [opportunity.cliente_id] : [];
    }

    onSubmit(finalOpportunity);
  };


  const handleCreateClient = async (newClient: Client) => {
    try {
      const createdClient = await createClient(newClient);
      // Añadir el nuevo cliente a la lista y seleccionarlo
      setClients(prevClients => [...prevClients, createdClient]);
      setOpportunity(prevOpp => ({
        ...prevOpp,
        cliente_id: createdClient.id,
        empresa: createdClient.empresa,
      }));
      setIsClientModalOpen(false); // Cerrar el modal
    } catch (error) {
      console.error("Error creating client:", error);
      // Aquí podrías mostrar una notificación de error al usuario
      alert('Hubo un error al crear el cliente.');
    }
  };


  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 p-2">
        {/* <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Editar' : 'Nueva'} Oportunidad</h2> */}

        <fieldset className="space-y-6">
          <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Datos del Proyecto</legend>
          
          <div>
            <label htmlFor="nombre_proyecto" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto</label>
            <input id="nombre_proyecto" name="nombre_proyecto" value={opportunity.nombre_proyecto} onChange={handleChange} placeholder="Ej: Implementación de CRM para Acme Corp" required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea id="description" name="description" value={opportunity.description} onChange={handleChange} placeholder="Añade una descripción detallada de la oportunidad..." rows={3} required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          <div>
            <label htmlFor="estimated_closure_date" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Cierre Estimada</label>
            <input type="date" id="estimated_closure_date" name="estimated_closure_date" value={opportunity.estimated_closure_date || ''} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none min-w-0" />
          </div>

          <div>
            <label htmlFor="createdAt" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
            <input type="date" id="createdAt" name="createdAt" value={opportunity.createdAt || ''} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none min-w-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vinculación</label>
              <div className="flex gap-4 mt-1">
                <label className="inline-flex items-center cursor-pointer">
                  <input type="radio" className="form-radio text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300" name="linkType" value="company" checked={linkType === 'company'} onChange={() => setLinkType('company')} />
                  <span className="ml-2 text-sm text-gray-700">Empresa (Cuenta)</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="radio" className="form-radio text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300" name="linkType" value="contact" checked={linkType === 'contact'} onChange={() => setLinkType('contact')} />
                  <span className="ml-2 text-sm text-gray-700">Contacto Individual</span>
                </label>
              </div>
            </div>

            {linkType === 'company' ? (
              <>
                <div>
                  <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <Select inputId="companyId" name="companyId" options={companyOptions} value={selectedCompanyValue} onChange={handleCompanyChange} placeholder="-- Seleccione una Empresa --" isClearable isSearchable required />
                </div>
                <div>
                  <label htmlFor="contactIds" className="block text-sm font-medium text-gray-700 mb-1">Contactos Asociados (Opcional)</label>
                  <Select inputId="contactIds" name="contactIds" isMulti options={companyContactOptions} value={selectedContactsValue} onChange={handleContactsChange} placeholder={opportunity.companyId ? "-- Seleccione uno o más contactos --" : "-- Seleccione primero una empresa --"} isClearable isSearchable isDisabled={!opportunity.companyId} />
                </div>
              </>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700">Contacto</label>
                  <button type="button" onClick={() => setIsClientModalOpen(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    + Nuevo Contacto
                  </button>
                </div>
                <Select inputId="cliente_id" name="cliente_id" options={clientOptions} value={selectedClientValue} onChange={handleClientChange} placeholder="-- Seleccione un Contacto --" isClearable isSearchable required />
              </div>
            )}

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
              <label htmlFor="monto_licenciamiento" className="block text-sm font-medium text-gray-700 mb-1">
                Monto {getLabelName('c6d3df39-53e7-40b9-8e2b-f1de16b5394f', 'Licenciamiento')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input id="monto_licenciamiento" type="text" name="monto_licenciamiento" value={editingField === 'monto_licenciamiento' ? opportunity.monto_licenciamiento || '' : formatCurrency(opportunity.monto_licenciamiento)} onFocus={handleFocus} onBlur={handleBlur} onChange={handleCurrencyChange} placeholder="0.00" className="w-full border rounded pl-7 pr-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-right font-medium" />
              </div>
            </div>
            <div>
              <label htmlFor="monto_servicios" className="block text-sm font-medium text-gray-700 mb-1">
                Monto {getLabelName('7d90d810-74d3-4613-882d-8e814a029db5', 'Servicios')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input id="monto_servicios" type="text" name="monto_servicios" value={editingField === 'monto_servicios' ? opportunity.monto_servicios || '' : formatCurrency(opportunity.monto_servicios)} onFocus={handleFocus} onBlur={handleBlur} onChange={handleCurrencyChange} placeholder="0.00" className="w-full border rounded pl-7 pr-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-right font-medium" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total de Productos {opportunity.moneda === 'USD' ? '(USD convertido)' : '(MXN)'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input
                  type="text"
                  value={formatCurrency(convertedProductsPrice)}
                  readOnly
                  disabled
                  className="w-full border rounded pl-7 pr-3 py-2 border-gray-300 bg-gray-50 text-gray-500 text-right cursor-not-allowed font-medium"
                />
              </div>
              {opportunity.moneda === 'USD' && (
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Original: {formatCurrency(productsPriceSum)} MXN
                </span>
              )}
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
                  <input id="tipoCambio" type="text" name="tipoCambio" value={editingField === 'tipoCambio' ? opportunity.tipoCambio || '' : formatCurrency(opportunity.tipoCambio)} onFocus={handleFocus} onBlur={handleBlur} onChange={handleCurrencyChange} placeholder="0.00" required={opportunity.moneda === 'USD'} className="w-full border rounded pl-7 pr-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-right font-medium" />
                </div>
              </div>
            )}
            <div className={opportunity.moneda === 'USD' ? '' : 'md:col-span-2'}>
              <label className="block text-sm font-semibold text-indigo-950 mb-1">Monto Total de la Oportunidad</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-indigo-700 font-bold">$</span>
                <input
                  type="text"
                  value={formatCurrency(opportunity.monto_total || 0)}
                  readOnly
                  disabled
                  className="w-full border border-indigo-200 rounded pl-7 pr-3 py-2 bg-indigo-50/50 text-indigo-700 text-right cursor-not-allowed font-bold"
                />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-6">
          <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Clasificación</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="stage_id" className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
              <select id="stage_id" name="stage_id" value={opportunity.stage_id} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="" disabled>-- Seleccione una etapa --</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.strname}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="linea_negocio_id" className="block text-sm font-medium text-gray-700 mb-1">
                {getLabelName('f509fa84-0b73-45f8-b3ab-b8471e98822e', 'Línea de Negocio')}
              </label>
              <select id="linea_negocio_id" name="linea_negocio_id" value={opportunity.linea_negocio_id || ''} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" required>
                <option value="" disabled>-- Seleccione una opción --</option>
                {businessLines.map(bl => <option key={bl.id} value={bl.id}>{bl.strname}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="tipo_entrega_id" className="block text-sm font-medium text-gray-700 mb-1">
                {getLabelName('7d90d810-74d3-4613-882d-8e814a029db5', 'Tipo de Entrega')}
              </label>
              <select id="tipo_entrega_id" name="tipo_entrega_id" value={opportunity.tipo_entrega_id || ''} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" required>
                <option value="" disabled>-- Seleccione una opción --</option>
                {deliveryTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.strname}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="licenciamiento_id" className="block text-sm font-medium text-gray-700 mb-1">
                {getLabelName('c6d3df39-53e7-40b9-8e2b-f1de16b5394f', 'Licenciamiento')}
              </label>
              <select id="licenciamiento_id" name="licenciamiento_id" value={opportunity.licenciamiento_id || ''} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
                {licensings.map(l => <option key={l.id} value={l.id}>{l.strname}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="productIds" className="block text-sm font-medium text-gray-700 mb-1">Productos</label>
              <Select inputId="productIds" name="productIds" isMulti options={productOptions} value={selectedProductsValue} onChange={handleProductsChange} placeholder="-- Seleccione uno o más productos --" isClearable isSearchable />
            </div>
          </div>
        </fieldset>

        {/* Collapsible Product Specs Viewer Section */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm mt-4">
          <button
            type="button"
            onClick={() => setIsDocsSectionOpen(!isDocsSectionOpen)}
            className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              <span className="font-semibold text-gray-800 text-sm">
                Productos seleccionados
              </span>
              {opportunity.productIds && opportunity.productIds.length > 0 && (
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {opportunity.productIds.length}
                </span>
              )}
            </div>
            <ChevronDown
              size={18}
              className={`text-gray-500 transition-transform duration-300 ${isDocsSectionOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDocsSectionOpen && (
            <div className="p-5 border-t border-gray-150 bg-white space-y-4 animate-fade-in">
              {!opportunity.productIds || opportunity.productIds.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  Ningún producto seleccionado. Agrega productos en la sección de Clasificación para consultar sus documentos.
                </div>
              ) : (
                <div className="space-y-6">
                  {products
                    .filter(p => opportunity.productIds?.includes(p.id!))
                    .map((p) => {
                      const imageSrc = p.imagenPortada 
                        ? (p.imagenPortada.startsWith('http') 
                            ? p.imagenPortada 
                            : `${baseUrl}${p.imagenPortada.startsWith('/') ? '' : '/'}${p.imagenPortada}`)
                        : null;
                      const files = p.files || [];

                      return (
                        <div key={p.id} className="border border-slate-150 rounded-xl p-4 bg-slate-50/20 space-y-3">
                          {/* Info del Producto con Imagen */}
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0 shadow-sm">
                              {imageSrc ? (
                                <img 
                                  src={imageSrc} 
                                  alt={p.nombre} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/150x150?text=Producto';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg">
                                  {p.nombre.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-slate-800 truncate">{p.nombre}</h4>
                              {p.descripcion && (
                                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5" title={p.descripcion}>
                                  {p.descripcion}
                                </p>
                              )}
                              <p className="text-xs font-semibold text-indigo-600 mt-1">
                                Precio Base: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(p.precioBase)}
                              </p>
                            </div>
                          </div>

                          {/* Documentos del Producto */}
                          <div className="border-t border-slate-100 pt-3">
                            <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                              Fichas técnicas y documentos
                            </h5>
                            {files.length === 0 ? (
                              <div className="text-left text-gray-500 text-xs italic py-1">
                                Este producto no tiene fichas técnicas o documentos adjuntos registrados.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {files.map((file) => {
                                  return (
                                    <button
                                      key={file.id}
                                      type="button"
                                      onClick={() => handleDownloadProductFile(p.id!, file)}
                                      disabled={downloadingFileId === file.id}
                                      className="flex items-center justify-between p-3 border border-slate-150 rounded-xl bg-white hover:bg-slate-50 hover:border-indigo-300 transition-all group cursor-pointer disabled:opacity-50 w-full text-left"
                                    >
                                      <div className="flex items-center gap-2.5 truncate pr-4">
                                        <FileText size={16} className="text-indigo-500 flex-shrink-0 group-hover:scale-105 transition-transform" />
                                        <div className="truncate text-left">
                                          <p className="text-xs font-semibold text-slate-800 truncate" title={file.title || file.fileName}>
                                            {file.title || file.fileName}
                                          </p>
                                          <p className="text-[10px] text-slate-400 truncate">
                                            {file.fileName}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0 flex items-center gap-1">
                                        {downloadingFileId === file.id ? (
                                          <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          <span>Descargar →</span>
                                        )}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
            Cancelar
          </button>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Guardar
          </button>
        </div>
      </form>

      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-full overflow-y-auto">
            <div className="p-6">
              <ClientForm 
                onSubmit={handleCreateClient}
                onCancel={() => setIsClientModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OpportunityForm;
