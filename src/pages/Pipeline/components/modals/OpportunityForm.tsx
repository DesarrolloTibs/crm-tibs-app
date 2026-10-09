import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { SingleValue, MultiValue } from 'react-select';
import { FileText, ChevronDown } from 'lucide-react';
import type {
  Opportunity,
  CurrencyType,
  Stage,
  Client,
  Company,
  User,
  Product,
  OpportunityLabel,
  OpportunityCatalogOption,
  OpportunityFormData,
} from '../../schemas/pipeline.schema';
import { Currency } from '../../schemas/pipeline.schema';
import { validateOpportunityForm, INITIAL_OPPORTUNITY_FORM } from '../../utils/pipeline.helpers';

import { getActiveCatalogOptions } from '../../../../services/opportunityCatalogsService';
import { getActiveStages } from '../../../../services/pipelinesService';
import { getClients, createClient } from '../../../../services/clientsService';
import { getUsers } from '../../../../services/usersService';
import { getCompanies } from '../../../../services/companiesService';
import { getProducts, downloadProductFile } from '../../../../services/productsService';
import { getOpportunityLabels } from '../../../../services/opportunityLabelsService';
import { useAuth } from '../../../../hooks/useAuth';
import { formatCurrency, formatNumber } from '../../../../utils/formatters';
import { showToast } from '../../../../utils/toast';

import FormField from '../../../../components/shared/FormField';
import Select from '../../../../components/shared/Select';
import Button from '../../../../components/shared/Button';
import Badge from '../../../../components/shared/Badge';
import StageStepper from '../../../../components/shared/StageStepper';
import Loader from '../../../../components/shared/Loader';
import { ContactModal } from '../../../Clients';

interface Props {
  initialData?: Opportunity;
  onSubmit: (opportunity: Partial<Opportunity>) => void | Promise<void>;
  onCancel: () => void;
  stages?: Stage[];
  clients?: Client[];
  companies?: Company[];
  products?: Product[];
  opportunityLabels?: OpportunityLabel[];
  businessLines?: OpportunityCatalogOption[];
  deliveryTypes?: OpportunityCatalogOption[];
  licensings?: OpportunityCatalogOption[];
  executives?: User[];
  loadingCatalogs?: boolean;
}

interface SelectOption {
  value: string;
  label: string;
  isDisabled?: boolean;
}

export const OpportunityForm: React.FC<Props> = ({
  initialData,
  onSubmit,
  onCancel,
  stages: propStages,
  clients: propClients,
  companies: propCompanies,
  products: propProducts,
  opportunityLabels: propOpportunityLabels,
  businessLines: propBusinessLines,
  deliveryTypes: propDeliveryTypes,
  licensings: propLicensings,
  executives: propExecutives,
  loadingCatalogs = false,
}) => {
  const { user, isAdmin } = useAuth();
  const [internalClients, setInternalClients] = useState<Client[]>([]);
  const [internalCompanies, setInternalCompanies] = useState<Company[]>([]);
  const [internalExecutives, setInternalExecutives] = useState<User[]>([]);
  const [internalProducts, setInternalProducts] = useState<Product[]>([]);
  const [internalOpportunityLabels, setInternalOpportunityLabels] = useState<OpportunityLabel[]>([]);
  const [internalBusinessLines, setInternalBusinessLines] = useState<OpportunityCatalogOption[]>([]);
  const [internalDeliveryTypes, setInternalDeliveryTypes] = useState<OpportunityCatalogOption[]>([]);
  const [internalLicensings, setInternalLicensings] = useState<OpportunityCatalogOption[]>([]);
  const [internalStages, setInternalStages] = useState<Stage[]>([]);
  const [extraClients, setExtraClients] = useState<Client[]>([]);

  // Resolución unificada: se priorizan los catálogos provistos externamente desde el módulo
  const stages = propStages ?? internalStages;
  const rawClients = propClients ?? internalClients;
  const clients = useMemo(() => [...rawClients, ...extraClients], [rawClients, extraClients]);
  const companies = propCompanies ?? internalCompanies;
  const products = propProducts ?? internalProducts;
  const opportunityLabels = propOpportunityLabels ?? internalOpportunityLabels;
  const businessLines = propBusinessLines ?? internalBusinessLines;
  const deliveryTypes = propDeliveryTypes ?? internalDeliveryTypes;
  const licensings = propLicensings ?? internalLicensings;
  const executives = propExecutives ?? internalExecutives;

  const baseUrl = import.meta.env.VITE_BASE_URL || '';

  const [isDocsSectionOpen, setIsDocsSectionOpen] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [linkType, setLinkType] = useState<'company' | 'contact'>(
    initialData?.companyId ? 'company' : 'contact'
  );

  // Cantidades de productos
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    if (initialData?.opportunityProducts && initialData.opportunityProducts.length > 0) {
      initialData.opportunityProducts.forEach((op) => {
        if (op.productId) map[op.productId] = Number(op.cantidad) || 1;
      });
    } else if (initialData?.products) {
      initialData.products.forEach((p) => {
        if (p.id) map[p.id] = 1;
      });
    }
    return map;
  });

  // Estado del formulario
  const [opportunity, setOpportunity] = useState<OpportunityFormData>(() => {
    if (!initialData) return INITIAL_OPPORTUNITY_FORM;

    let initialClosureDate = '';
    if (initialData?.estimated_closure_date) {
      const d = new Date(initialData.estimated_closure_date);
      if (!isNaN(d.getTime())) {
        initialClosureDate = d.toISOString().split('T')[0];
      }
    }

    let initialCreatedAt = '';
    if (initialData?.createdAt) {
      const d = new Date(initialData.createdAt);
      if (!isNaN(d.getTime())) {
        initialCreatedAt = d.toISOString().split('T')[0];
      }
    }

    return {
      id: initialData?.id,
      nombre_proyecto: initialData?.nombre_proyecto || '',
      description: initialData?.description || '',
      estimated_closure_date: initialClosureDate,
      createdAt: initialCreatedAt,
      empresa: initialData?.empresa || '',
      companyId: initialData?.companyId || null,
      contactIds:
        initialData?.contacts?.map((c) => c.id!) ||
        (initialData?.cliente_id ? [initialData.cliente_id] : []),
      productIds:
        initialData?.opportunityProducts?.map((op) => op.productId).filter(Boolean) ||
        initialData?.products?.map((p) => p.id!).filter(Boolean) ||
        [],
      monto_licenciamiento: initialData?.monto_licenciamiento || 0,
      monto_servicios: initialData?.monto_servicios || 0,
      monto_total: initialData?.monto_total || 0,
      moneda: (initialData?.moneda as CurrencyType) || 'MXN',
      tipoCambio: initialData?.tipoCambio || (initialData?.moneda === 'USD' ? 1 : 0),
      stage_id: initialData?.stage_id || '',
      cliente_id: initialData?.cliente_id || null,
      ejecutivo_id: initialData?.ejecutivo_id || '',
      priority: initialData?.priority ?? 1,
      linea_negocio_id: initialData?.linea_negocio_id || null,
      tipo_entrega_id: initialData?.tipo_entrega_id || null,
      licenciamiento_id: initialData?.licenciamiento_id || null,
      linkType: initialData?.companyId ? 'company' : 'contact',
    };
  });

  // Sincronizar estado cuando cambie initialData (ej: cambio de oportunidad a editar)
  useEffect(() => {
    if (initialData) {
      let closureDateStr = '';
      if (initialData.estimated_closure_date) {
        const d = new Date(initialData.estimated_closure_date);
        if (!isNaN(d.getTime())) {
          closureDateStr = d.toISOString().split('T')[0];
        }
      }

      let createdAtStr = '';
      if (initialData.createdAt) {
        const d = new Date(initialData.createdAt);
        if (!isNaN(d.getTime())) {
          createdAtStr = d.toISOString().split('T')[0];
        }
      }

      setOpportunity({
        id: initialData.id,
        nombre_proyecto: initialData.nombre_proyecto || '',
        description: initialData.description || '',
        estimated_closure_date: closureDateStr,
        createdAt: createdAtStr,
        empresa: initialData.empresa || '',
        companyId: initialData.companyId || null,
        contactIds:
          initialData.contacts?.map((c) => c.id!) ||
          (initialData.cliente_id ? [initialData.cliente_id] : []),
        productIds:
          initialData.opportunityProducts?.map((op) => op.productId).filter(Boolean) ||
          initialData.products?.map((p) => p.id!).filter(Boolean) ||
          [],
        monto_licenciamiento: initialData.monto_licenciamiento || 0,
        monto_servicios: initialData.monto_servicios || 0,
        monto_total: initialData.monto_total || 0,
        moneda: (initialData.moneda as CurrencyType) || 'MXN',
        tipoCambio: initialData.tipoCambio || (initialData.moneda === 'USD' ? 1 : 0),
        stage_id: initialData.stage_id || '',
        cliente_id: initialData.cliente_id || null,
        ejecutivo_id: initialData.ejecutivo_id || '',
        priority: initialData.priority ?? 1,
        linea_negocio_id: initialData.linea_negocio_id || null,
        tipo_entrega_id: initialData.tipo_entrega_id || null,
        licenciamiento_id: initialData.licenciamiento_id || null,
        linkType: initialData.companyId ? 'company' : 'contact',
      });

      const map: Record<string, number> = {};
      if (initialData.opportunityProducts && initialData.opportunityProducts.length > 0) {
        initialData.opportunityProducts.forEach((op) => {
          if (op.productId) map[op.productId] = Number(op.cantidad) || 1;
        });
      } else if (initialData.products) {
        initialData.products.forEach((p) => {
          if (p.id) map[p.id] = 1;
        });
      }
      setProductQuantities(map);
      setLinkType(initialData.companyId ? 'company' : 'contact');
      setErrors({});
      setTouched({});
    }
  }, [initialData]);

  // Errores y estado touched alineados al estándar Yup
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper de etiquetas dinámicas
  const getLabelNameByKey = (
    key: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento',
    defaultName: string
  ) => {
    const label = opportunityLabels.find((l) => l.field_key === key);
    return label && label.strname ? label.strname : defaultName;
  };

  // Fallback: solo se ejecuta si NO se proveyeron catálogos externos (ej. uso fuera de Pipeline)
  const isFetchingFallbackRef = useRef<boolean>(false);
  const hasLoadedFallbackRef = useRef<boolean>(false);

  useEffect(() => {
    if (propStages && propClients) return;
    if (hasLoadedFallbackRef.current || isFetchingFallbackRef.current) return;
    isFetchingFallbackRef.current = true;

    const loadFallbackData = async () => {
      try {
        const [
          stagesData,
          clientsData,
          companiesData,
          productsData,
          labelsData,
          blData,
          dtData,
          licData,
          usersData,
        ] = await Promise.all([
          getActiveStages(),
          getClients(),
          getCompanies(),
          getProducts(),
          getOpportunityLabels(),
          getActiveCatalogOptions('business-lines'),
          getActiveCatalogOptions('delivery-types'),
          getActiveCatalogOptions('licensings'),
          getUsers().catch(() => []),
        ]);

        setInternalStages(stagesData);
        setInternalClients(clientsData);
        setInternalCompanies(companiesData);
        setInternalProducts(productsData);
        setInternalOpportunityLabels(labelsData);
        setInternalBusinessLines(blData);
        setInternalDeliveryTypes(dtData);
        setInternalLicensings(licData);
        setInternalExecutives(usersData);
        hasLoadedFallbackRef.current = true;
      } catch (err) {
        console.error('Error al cargar datos fallback del formulario de oportunidad:', err);
      } finally {
        isFetchingFallbackRef.current = false;
      }
    };
    loadFallbackData();
  }, [propStages, propClients]);

  // Autoselección de etapa y campos requeridos cuando los catálogos estén disponibles
  useEffect(() => {
    setOpportunity((prev) => {
      const updates: Partial<OpportunityFormData> = {};
      if (!prev.stage_id && stages.length > 0) {
        const initialStage = stages.find((s) => s.blninitial) || stages[0];
        if (initialStage) updates.stage_id = initialStage.id;
      }
      if (!prev.linea_negocio_id && businessLines.length > 0) {
        updates.linea_negocio_id = businessLines[0].id;
      }
      if (!prev.tipo_entrega_id && deliveryTypes.length > 0) {
        updates.tipo_entrega_id = deliveryTypes[0].id;
      }
      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
    });
  }, [stages, businessLines, deliveryTypes]);

  // Si no es admin, fijar usuario activo como ejecutivo
  useEffect(() => {
    if (!isAdmin && user && !opportunity.ejecutivo_id) {
      setOpportunity((o) => ({ ...o, ejecutivo_id: user.sub }));
    }
  }, [user, isAdmin, opportunity.ejecutivo_id]);

  // Sumatoria y conversión de productos
  const productsPriceSum = useMemo(() => {
    if (!opportunity.productIds || opportunity.productIds.length === 0) return 0;
    return products
      .filter((p) => opportunity.productIds?.includes(p.id!))
      .reduce((sum, p) => {
        const qty = productQuantities[p.id!] || 1;
        return sum + qty * (Number(p.precioBase) || 0);
      }, 0);
  }, [opportunity.productIds, products, productQuantities]);

  const convertedProductsPrice = useMemo(() => {
    if (opportunity.moneda === 'USD') {
      const rate = Number(opportunity.tipoCambio) || 0;
      return rate > 0 ? productsPriceSum / rate : 0;
    }
    return productsPriceSum;
  }, [opportunity.moneda, opportunity.tipoCambio, productsPriceSum]);

  // Cálculo de Monto Total automático
  useEffect(() => {
    const licenciamiento = Number(opportunity.monto_licenciamiento) || 0;
    const servicios = Number(opportunity.monto_servicios) || 0;
    const total = licenciamiento + servicios + convertedProductsPrice;
    setOpportunity((o) => ({ ...o, monto_total: total }));
  }, [opportunity.monto_licenciamiento, opportunity.monto_servicios, convertedProductsPrice]);

  const formatCurrencyInput = (value: number | undefined | string | null) =>
    formatNumber(value ?? undefined, { decimals: 2, emptyIfNull: true });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setEditingField(e.target.name);
  };

  const handleBlur = async (field: keyof OpportunityFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let finalEjecutivoId = opportunity.ejecutivo_id;
    if (!isAdmin && !finalEjecutivoId && user) {
      finalEjecutivoId = user.sub;
    }
    const result = await validateOpportunityForm({
      ...opportunity,
      linkType,
      ejecutivo_id: finalEjecutivoId,
    });
    if (!result.isValid && result.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFinancialBlur = async (field: keyof OpportunityFormData) => {
    const currentValue = opportunity[field] as any;
    const numericValue = parseFloat(String(currentValue));
    const roundedValue = isNaN(numericValue) ? 0 : Number(numericValue.toFixed(2));

    setOpportunity((prev) => ({ ...prev, [field]: roundedValue }));
    setEditingField(null);
    setTouched((prev) => ({ ...prev, [field]: true }));

    let finalEjecutivoId = opportunity.ejecutivo_id;
    if (!isAdmin && !finalEjecutivoId && user) {
      finalEjecutivoId = user.sub;
    }

    const result = await validateOpportunityForm({
      ...opportunity,
      [field]: roundedValue,
      linkType,
      ejecutivo_id: finalEjecutivoId,
    });
    if (!result.isValid && result.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'moneda') {
      setOpportunity((prev) => {
        const newTipoCambio = value === 'MXN' ? 0 : prev.tipoCambio || 1;
        return {
          ...prev,
          moneda: value as CurrencyType,
          tipoCambio: Number(newTipoCambio.toFixed(2)),
        };
      });
    } else {
      setOpportunity((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    const numericValue = parseFloat(sanitizedValue);
    setOpportunity((prev) => ({
      ...prev,
      [name]: isNaN(numericValue) ? '' : sanitizedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Opciones de Clientes
  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        value: client.id!,
        label: `${client.nombre} ${client.apellido} (${
          client.company?.nombre || client.empresa || 'Sin empresa'
        }) ${!client.estatus ? '(Inactivo)' : ''}`,
        isDisabled: !client.estatus && client.id !== initialData?.cliente_id,
      })),
    [clients, initialData?.cliente_id]
  );

  const handleClientChange = (selectedOption: SingleValue<SelectOption>) => {
    const clientId = selectedOption ? selectedOption.value : '';
    const selectedClient = clients.find((c) => c.id === clientId);
    setOpportunity((prev) => ({
      ...prev,
      cliente_id: clientId || null,
      empresa: selectedClient?.empresa || prev.empresa,
      companyId: selectedClient?.companyId || prev.companyId,
    }));
    if (errors.cliente_id) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.cliente_id;
        return next;
      });
    }
  };

  // Opciones de Empresas
  const companyOptions = useMemo(
    () =>
      companies.map((company) => ({
        value: company.id!,
        label: `${company.nombre} ${!company.estatus ? '(Inactiva)' : ''}`,
        isDisabled: !company.estatus && company.id !== initialData?.companyId,
      })),
    [companies, initialData?.companyId]
  );

  const handleCompanyChange = (selectedOption: SingleValue<SelectOption>) => {
    const companyId = selectedOption ? selectedOption.value : null;
    const selectedComp = companies.find((c) => c.id === companyId);
    setOpportunity((prev) => ({
      ...prev,
      companyId,
      empresa: selectedComp?.nombre || '',
      contactIds: [],
    }));
    if (errors.companyId) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.companyId;
        return next;
      });
    }
  };

  const selectedCompany = companies.find((c) => c.id === opportunity.companyId);
  const companyContactOptions = useMemo(() => {
    if (!selectedCompany?.contacts || selectedCompany.contacts.length === 0) return [];
    const options: SelectOption[] = [
      {
        value: 'SELECT_ALL',
        label: 'Seleccionar todos los contactos',
      },
    ];
    selectedCompany.contacts.forEach((contact) => {
      options.push({
        value: contact.id!,
        label: `${contact.nombre} ${contact.apellido || ''} ${
          contact.puesto ? `(${contact.puesto})` : ''
        }`.trim(),
      });
    });
    return options;
  }, [selectedCompany]);

  const selectedCompanyValue =
    companyOptions.find((option) => option.value === opportunity.companyId) || null;

  const selectedContactsValue = useMemo(() => {
    if (!selectedCompany?.contacts || !opportunity.contactIds) return [];
    return companyContactOptions.filter(
      (opt) => opt.value !== 'SELECT_ALL' && opportunity.contactIds?.includes(opt.value)
    );
  }, [selectedCompany, opportunity.contactIds, companyContactOptions]);

  const handleContactsChange = (selectedOptions: MultiValue<SelectOption>) => {
    const ids = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    if (ids.includes('SELECT_ALL')) {
      const realContactIds = (selectedCompany?.contacts || []).map((c) => c.id!);
      const allSelected = realContactIds.every((id) =>
        opportunity.contactIds?.includes(id)
      );
      setOpportunity((prev) => ({
        ...prev,
        contactIds: allSelected ? [] : realContactIds,
      }));
    } else {
      setOpportunity((prev) => ({
        ...prev,
        contactIds: ids,
      }));
    }
  };

  // Opciones de Ejecutivos
  const executiveOptions: SelectOption[] = useMemo(
    () =>
      executives.map((exec) => ({
        value: exec.id!,
        label: `${exec.username} ${!exec.isActive ? '(Inactivo)' : ''}`,
        isDisabled: !exec.isActive && exec.id !== initialData?.ejecutivo_id,
      })),
    [executives, initialData?.ejecutivo_id]
  );

  const handleExecutiveChange = (selectedOption: SingleValue<SelectOption>) => {
    setOpportunity((prev) => ({
      ...prev,
      ejecutivo_id: selectedOption ? selectedOption.value : '',
    }));
    if (errors.ejecutivo_id) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.ejecutivo_id;
        return next;
      });
    }
  };

  // Opciones de Productos
  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.id!,
        label: `${product.nombre} (${formatCurrency(product.precioBase, 'MXN', {
          decimals: 2,
        })} / ${product.unidadMedida || 'Pieza'})`,
      })),
    [products]
  );

  const selectedProductsValue = productOptions.filter((option) =>
    opportunity.productIds?.includes(option.value)
  );

  const handleProductsChange = (selectedOptions: MultiValue<SelectOption>) => {
    const ids = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setOpportunity((prev) => ({
      ...prev,
      productIds: ids,
    }));
  };

  const selectedClientValue =
    clientOptions.find((option) => option.value === opportunity.cliente_id) || null;
  const selectedExecutiveValue =
    executiveOptions.find((option) => option.value === opportunity.ejecutivo_id) || null;

  const blOptions = useMemo(
    () => businessLines.map((bl) => ({ value: bl.id, label: bl.strname })),
    [businessLines]
  );
  const dtOptions = useMemo(
    () => deliveryTypes.map((dt) => ({ value: dt.id, label: dt.strname })),
    [deliveryTypes]
  );
  const lOptions = useMemo(
    () => licensings.map((l) => ({ value: l.id, label: l.strname })),
    [licensings]
  );
  const currencyOptions = Object.values(Currency).map((c) => ({ value: c, label: c }));

  // Descarga de archivos de producto
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
      console.error('Error al descargar el archivo del producto:', error);
      showToast.error('No se pudo descargar el archivo.');
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Creación rápida de cliente
  const handleCreateClient = async (newClient: Client) => {
    try {
      const createdClient = await createClient(newClient);
      setExtraClients((prevClients) => [...prevClients, createdClient]);
      setOpportunity((prevOpp) => ({
        ...prevOpp,
        cliente_id: createdClient.id,
        empresa: createdClient.empresa,
      }));
      setIsClientModalOpen(false);
      showToast.success('Contacto creado y asignado.');
    } catch (error) {
      console.error('Error creating client:', error);
      showToast.error('Hubo un error al crear el contacto.');
    }
  };

  // Envío y validación con Yup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let finalEjecutivoId = opportunity.ejecutivo_id;
    if (!isAdmin && !finalEjecutivoId && user) {
      finalEjecutivoId = user.sub;
    }

    const payloadToValidate: Partial<OpportunityFormData> = {
      ...opportunity,
      linkType,
      ejecutivo_id: finalEjecutivoId,
    };

    const { isValid, errors: validationErrors } = await validateOpportunityForm(
      payloadToValidate
    );

    if (!isValid) {
      setErrors(validationErrors);
      setTouched({
        nombre_proyecto: true,
        description: true,
        companyId: linkType === 'company',
        cliente_id: linkType === 'contact',
        ejecutivo_id: true,
        linea_negocio_id: true,
        tipo_entrega_id: true,
        tipoCambio: opportunity.moneda === 'USD',
        monto_licenciamiento: true,
        monto_servicios: true,
      });
      const firstErrorKey = Object.keys(validationErrors)[0];
      if (firstErrorKey) {
        const el = document.getElementById(firstErrorKey);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        estimated_closure_date,
        createdAt,
        products: _p,
        contacts: _c,
        cliente: _cl,
        company: _cp,
        ejecutivo: _ej,
        stage: _st,
        interactions: _in,
        reminders: _rm,
        files: _fl,
        archived: _ar,
        proposalDocumentPath: _pd,
        linea_negocio: _ln,
        tipo_entrega: _te,
        licenciamiento: _lc,
        linkType: _lt,
        ...rest
      } = opportunity as any;

      let closureDate: Date | undefined = undefined;
      if (estimated_closure_date) {
        const parts = String(estimated_closure_date).split('-');
        closureDate = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
          12
        );
      }

      let creationDate: Date | undefined = undefined;
      if (createdAt) {
        const parts = String(createdAt).split('-');
        creationDate = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
          12
        );
      }

      const productItems = (opportunity.productIds || []).map((id) => ({
        productId: id,
        cantidad: productQuantities[id] || 1,
      }));

      const finalOpportunity: Partial<Opportunity> = {
        ...rest,
        id: initialData?.id || opportunity.id,
        ejecutivo_id: finalEjecutivoId,
        monto_licenciamiento: Number(opportunity.monto_licenciamiento) || 0,
        monto_servicios: Number(opportunity.monto_servicios) || 0,
        tipoCambio: Number(opportunity.tipoCambio) || 0,
        estimated_closure_date: typeof opportunity.estimated_closure_date === 'string' && opportunity.estimated_closure_date
          ? opportunity.estimated_closure_date
          : closureDate?.toISOString().split('T')[0],
        createdAt: creationDate,
        productIds: opportunity.productIds || [],
        productItems,
      };

      if (linkType === 'company') {
        finalOpportunity.cliente_id = null;
      } else {
        finalOpportunity.companyId = null;
        finalOpportunity.contactIds = opportunity.cliente_id
          ? [opportunity.cliente_id]
          : [];
      }

      await onSubmit(finalOpportunity);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCatalogs) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader size="lg" />
        <span className="text-xs font-semibold text-slate-400">
          Cargando opciones y catálogos de la oportunidad...
        </span>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-6 p-2 font-sans">
        {/* Barra superior de fases de la Oportunidad */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Etapa de la Oportunidad
          </div>
          <StageStepper
            stages={stages}
            currentStageId={opportunity.stage_id || ''}
            stageEnteredAt={initialData?.stage_entered_at}
            fallbackDate={initialData?.createdAt}
            showDuration={!!initialData}
            onStageClick={(s) => setOpportunity((prev) => ({ ...prev, stage_id: s.id }))}
          />
        </div>

        {/* Sección 1: Datos del Proyecto */}
        <fieldset className="space-y-4">
          <legend className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4 w-full">
            Datos del Proyecto
          </legend>

          <div className="space-y-4">
            <div>
              <FormField
                label="Nombre del Proyecto *"
                id="nombre_proyecto"
                name="nombre_proyecto"
                value={opportunity.nombre_proyecto}
                onChange={handleChange}
                onBlur={() => handleBlur('nombre_proyecto')}
                placeholder="Ej: Implementación de CRM para Acme Corp"
                error={touched.nombre_proyecto ? errors.nombre_proyecto : undefined}
              />
            </div>

            <div>
              <FormField
                as="textarea"
                label="Descripción *"
                id="description"
                name="description"
                value={opportunity.description}
                onChange={handleChange}
                onBlur={() => handleBlur('description')}
                placeholder="Añade una descripción detallada de la oportunidad..."
                error={touched.description ? errors.description : undefined}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Fecha de Cierre Estimada"
                type="date"
                id="estimated_closure_date"
                name="estimated_closure_date"
                value={opportunity.estimated_closure_date || ''}
                onChange={handleChange}
                onBlur={() => handleBlur('estimated_closure_date')}
                error={touched.estimated_closure_date ? errors.estimated_closure_date : undefined}
              />
              <FormField
                label="Fecha de Creación"
                type="date"
                id="createdAt"
                name="createdAt"
                value={opportunity.createdAt || ''}
                onChange={handleChange}
                onBlur={() => handleBlur('createdAt')}
                error={touched.createdAt ? errors.createdAt : undefined}
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                Prioridad
              </label>
              <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-2xl p-4">
                {[1, 2, 3].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setOpportunity((prev) => ({
                        ...prev,
                        priority: prev.priority === star ? 0 : star,
                      }))
                    }
                    className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
                  >
                    <svg
                      className={`w-6 h-6 ${
                        star <= (opportunity.priority ?? 0)
                          ? 'text-amber-400 fill-current'
                          : 'text-gray-300'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}
                <span className="text-xs text-slate-500 ml-2 font-black uppercase tracking-wider">
                  {opportunity.priority === 0
                    ? 'Sin prioridad'
                    : opportunity.priority === 1
                    ? 'Baja'
                    : opportunity.priority === 2
                    ? 'Media'
                    : 'Alta'}
                </span>
              </div>
            </div>

            {/* Vinculación Comercial */}
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                Tipo de Vinculación
              </label>
              <div className="flex gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <label className="inline-flex items-center cursor-pointer select-none">
                  <input
                    type="radio"
                    className="form-radio text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300"
                    name="linkType"
                    value="company"
                    checked={linkType === 'company'}
                    onChange={() => {
                      setLinkType('company');
                      setTouched((prev) => ({ ...prev, cliente_id: false }));
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.cliente_id;
                        return next;
                      });
                    }}
                  />
                  <span className="ml-2 text-xs font-black text-slate-600 uppercase tracking-wider">
                    Empresa (Cuenta)
                  </span>
                </label>
                <label className="inline-flex items-center cursor-pointer select-none">
                  <input
                    type="radio"
                    className="form-radio text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300"
                    name="linkType"
                    value="contact"
                    checked={linkType === 'contact'}
                    onChange={() => {
                      setLinkType('contact');
                      setTouched((prev) => ({ ...prev, companyId: false }));
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.companyId;
                        return next;
                      });
                    }}
                  />
                  <span className="ml-2 text-xs font-black text-slate-600 uppercase tracking-wider">
                    Contacto Individual
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {linkType === 'company' ? (
                <>
                  <div>
                    <Select
                      label="Empresa *"
                      inputId="companyId"
                      name="companyId"
                      options={companyOptions}
                      value={selectedCompanyValue}
                      onChange={handleCompanyChange}
                      onBlur={() => handleBlur('companyId')}
                      placeholder="-- Seleccione una Empresa --"
                      error={touched.companyId ? errors.companyId : undefined}
                      isClearable
                      isSearchable
                    />
                  </div>
                  <div>
                    <Select
                      label="Contactos Asociados (Opcional)"
                      inputId="contactIds"
                      name="contactIds"
                      isMulti
                      options={companyContactOptions}
                      value={selectedContactsValue}
                      onChange={handleContactsChange}
                      placeholder={
                        opportunity.companyId
                          ? '-- Seleccione uno o más contactos --'
                          : '-- Seleccione primero una empresa --'
                      }
                      isClearable
                      isSearchable
                      isDisabled={!opportunity.companyId}
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1 pr-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">
                      Contacto *
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => setIsClientModalOpen(true)}
                      className="!text-[10px] !font-black !text-indigo-600 hover:!text-indigo-800 !uppercase !tracking-widest !p-0 hover:!bg-transparent"
                    >
                      + Nuevo Contacto
                    </Button>
                  </div>
                  <Select
                    inputId="cliente_id"
                    name="cliente_id"
                    options={clientOptions}
                    value={selectedClientValue}
                    onChange={handleClientChange}
                    onBlur={() => handleBlur('cliente_id')}
                    placeholder="-- Seleccione un Contacto --"
                    error={touched.cliente_id ? errors.cliente_id : undefined}
                    isClearable
                    isSearchable
                  />
                </div>
              )}

              {isAdmin && (
                <div className="md:col-span-2">
                  <Select
                    label="Ejecutivo Asignado *"
                    inputId="ejecutivo_id"
                    name="ejecutivo_id"
                    options={executiveOptions}
                    value={selectedExecutiveValue}
                    onChange={handleExecutiveChange}
                    onBlur={() => handleBlur('ejecutivo_id')}
                    placeholder="-- Asignar a un Ejecutivo --"
                    error={touched.ejecutivo_id ? errors.ejecutivo_id : undefined}
                    isClearable
                    isSearchable
                  />
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {/* Sección 2: Detalles Financieros */}
        <fieldset className="space-y-4">
          <legend className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4 w-full">
            Detalles Financieros
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={`Monto ${getLabelNameByKey('licenciamiento', 'Licenciamiento')}`}
              id="monto_licenciamiento"
              type="text"
              name="monto_licenciamiento"
              inputPrefix="$"
              value={
                editingField === 'monto_licenciamiento'
                  ? opportunity.monto_licenciamiento || ''
                  : formatCurrencyInput(opportunity.monto_licenciamiento)
              }
              onFocus={handleFocus}
              onBlur={() => handleFinancialBlur('monto_licenciamiento')}
              onChange={handleCurrencyChange}
              placeholder="0.00"
              className="text-right font-medium"
              error={touched.monto_licenciamiento ? errors.monto_licenciamiento : undefined}
            />
            <FormField
              label={`Monto ${getLabelNameByKey('tipo_entrega', 'Servicios')}`}
              id="monto_servicios"
              type="text"
              name="monto_servicios"
              inputPrefix="$"
              value={
                editingField === 'monto_servicios'
                  ? opportunity.monto_servicios || ''
                  : formatCurrencyInput(opportunity.monto_servicios)
              }
              onFocus={handleFocus}
              onBlur={() => handleFinancialBlur('monto_servicios')}
              onChange={handleCurrencyChange}
              placeholder="0.00"
              className="text-right font-medium"
              error={touched.monto_servicios ? errors.monto_servicios : undefined}
            />

            <div>
              <FormField
                label={`Total de Productos ${
                  opportunity.moneda === 'USD' ? '(USD convertido)' : '(MXN)'
                }`}
                type="text"
                inputPrefix="$"
                value={formatCurrencyInput(convertedProductsPrice)}
                readOnly
                disabled
                className="bg-slate-50/50 text-slate-500 text-right cursor-not-allowed font-medium"
              />
              {opportunity.moneda === 'USD' && (
                <span className="text-[10px] text-slate-400 mt-1 ml-1 block font-bold uppercase tracking-wider">
                  Original: {formatCurrencyInput(productsPriceSum)} MXN
                </span>
              )}
            </div>

            <Select
              label="Moneda *"
              id="moneda"
              name="moneda"
              options={currencyOptions}
              value={currencyOptions.find((opt) => opt.value === opportunity.moneda)}
              onChange={(val: any) => {
                const value = val ? val.value : 'USD';
                setOpportunity((prev) => {
                  const newTipoCambio = value === 'MXN' ? 0 : prev.tipoCambio || 1;
                  return {
                    ...prev,
                    moneda: value as CurrencyType,
                    tipoCambio: Number(newTipoCambio.toFixed(2)),
                  };
                });
              }}
            />

            {opportunity.moneda === 'USD' && (
              <FormField
                label="Tipo de Cambio (USD a MXN) *"
                id="tipoCambio"
                type="text"
                name="tipoCambio"
                inputPrefix="$"
                value={
                  editingField === 'tipoCambio'
                    ? opportunity.tipoCambio || ''
                    : formatCurrencyInput(opportunity.tipoCambio)
                }
                onFocus={handleFocus}
                onBlur={() => handleFinancialBlur('tipoCambio')}
                onChange={handleCurrencyChange}
                placeholder="0.00"
                className="text-right font-medium"
                error={touched.tipoCambio ? errors.tipoCambio : undefined}
              />
            )}

            <div
              className={
                opportunity.moneda === 'USD' ? 'md:col-span-1' : 'md:col-span-2'
              }
            >
              <FormField
                label="Monto Total de la Oportunidad"
                type="text"
                inputPrefix="$"
                value={formatCurrencyInput(opportunity.monto_total || 0)}
                readOnly
                disabled
                className="bg-indigo-50 border-indigo-200 text-indigo-700 text-right cursor-not-allowed font-bold"
              />
            </div>
          </div>
        </fieldset>

        {/* Sección 3: Clasificación Comercial */}
        <fieldset className="space-y-4">
          <legend className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4 w-full">
            Clasificación
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={getLabelNameByKey('linea_negocio', 'Línea de Negocio') + ' *'}
              id="linea_negocio_id"
              name="linea_negocio_id"
              options={blOptions}
              value={blOptions.find((opt) => opt.value === opportunity.linea_negocio_id)}
              onChange={(val: any) => {
                setOpportunity((prev) => ({
                  ...prev,
                  linea_negocio_id: val ? val.value : null,
                }));
                if (errors.linea_negocio_id) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.linea_negocio_id;
                    return next;
                  });
                }
              }}
              onBlur={() => handleBlur('linea_negocio_id')}
              error={touched.linea_negocio_id ? errors.linea_negocio_id : undefined}
              isClearable
            />
            <Select
              label={getLabelNameByKey('tipo_entrega', 'Tipo de Entrega') + ' *'}
              id="tipo_entrega_id"
              name="tipo_entrega_id"
              options={dtOptions}
              value={dtOptions.find((opt) => opt.value === opportunity.tipo_entrega_id)}
              onChange={(val: any) => {
                setOpportunity((prev) => ({
                  ...prev,
                  tipo_entrega_id: val ? val.value : null,
                }));
                if (errors.tipo_entrega_id) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.tipo_entrega_id;
                    return next;
                  });
                }
              }}
              onBlur={() => handleBlur('tipo_entrega_id')}
              error={touched.tipo_entrega_id ? errors.tipo_entrega_id : undefined}
              isClearable
            />
            <Select
              label={getLabelNameByKey('licenciamiento', 'Licenciamiento')}
              id="licenciamiento_id"
              name="licenciamiento_id"
              options={lOptions}
              value={lOptions.find((opt) => opt.value === opportunity.licenciamiento_id)}
              onChange={(val: any) =>
                setOpportunity((prev) => ({
                  ...prev,
                  licenciamiento_id: val ? val.value : null,
                }))
              }
              isClearable
            />
            <div className="md:col-span-2">
              <Select
                label="Productos"
                inputId="productIds"
                name="productIds"
                isMulti
                options={productOptions}
                value={selectedProductsValue}
                onChange={handleProductsChange}
                placeholder="-- Seleccione uno o más productos --"
                isClearable
                isSearchable
              />
            </div>
          </div>
        </fieldset>

        {/* Fichas técnicas y documentos de productos */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs mt-4">
          <button
            type="button"
            onClick={() => setIsDocsSectionOpen(!isDocsSectionOpen)}
            className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              <span className="font-semibold text-gray-800 text-sm">
                Productos seleccionados
              </span>
              {opportunity.productIds && opportunity.productIds.length > 0 && (
                <Badge variant="indigo" size="sm">
                  {opportunity.productIds.length}
                </Badge>
              )}
            </div>
            <ChevronDown
              size={18}
              className={`text-gray-500 transition-transform duration-300 ${
                isDocsSectionOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isDocsSectionOpen && (
            <div className="p-5 border-t border-slate-100 bg-white space-y-4">
              {!opportunity.productIds || opportunity.productIds.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  Ningún producto seleccionado. Agrega productos en la sección de
                  Clasificación para consultar sus especificaciones y documentos.
                </div>
              ) : (
                <div className="space-y-6">
                  {products
                    .filter((p) => opportunity.productIds?.includes(p.id!))
                    .map((p) => {
                      const imageSrc = p.imagenPortada
                        ? p.imagenPortada.startsWith('http')
                          ? p.imagenPortada
                          : `${baseUrl}${
                              p.imagenPortada.startsWith('/') ? '' : '/'
                            }${p.imagenPortada}`
                        : null;
                      const files = p.files || [];
                      const currentQty = productQuantities[p.id!] || 1;
                      const unitPrice = Number(p.precioBase || 0);
                      const subtotal = currentQty * unitPrice;

                      return (
                        <div
                          key={p.id}
                          className="border border-slate-150 rounded-xl p-4 bg-slate-50/20 space-y-3"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
                              {imageSrc ? (
                                <img
                                  src={imageSrc}
                                  alt={p.nombre}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      'https://placehold.co/150x150?text=Producto';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg">
                                  {p.nombre.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-slate-800 truncate">
                                {p.nombre}
                              </h4>
                              {p.descripcion && (
                                <p
                                  className="text-xs text-slate-500 line-clamp-2 mt-0.5"
                                  title={p.descripcion}
                                >
                                  {p.descripcion}
                                </p>
                              )}
                              <p className="text-xs font-semibold text-indigo-600 mt-1">
                                Precio Base:{' '}
                                {formatCurrency(unitPrice, 'MXN', { decimals: 2 })} /{' '}
                                {p.unidadMedida || 'Pieza'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700">
                                Cantidad:
                              </span>
                              <input
                                type="number"
                                min="1"
                                value={currentQty}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  setProductQuantities((prev) => ({
                                    ...prev,
                                    [p.id!]: val,
                                  }));
                                }}
                                className="w-16 h-8 px-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <span className="text-xs text-slate-500 font-medium">
                                {p.unidadMedida || 'Pieza'}(s)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Subtotal
                              </span>
                              <span className="text-xs font-black text-indigo-700">
                                {formatCurrency(subtotal, 'MXN', { decimals: 2 })}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-3">
                            <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                              Fichas técnicas y documentos
                            </h5>
                            {files.length === 0 ? (
                              <div className="text-left text-gray-500 text-xs italic py-1">
                                Este producto no tiene fichas técnicas registradas.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {files.map((file) => (
                                  <button
                                    key={file.id}
                                    type="button"
                                    onClick={() =>
                                      handleDownloadProductFile(p.id!, file)
                                    }
                                    disabled={downloadingFileId === file.id}
                                    className="flex items-center justify-between p-3 border border-slate-150 rounded-xl bg-white hover:bg-slate-50 hover:border-indigo-300 transition-all group cursor-pointer disabled:opacity-50 w-full text-left"
                                  >
                                    <div className="flex items-center gap-2.5 truncate pr-4">
                                      <FileText
                                        size={16}
                                        className="text-indigo-500 flex-shrink-0 group-hover:scale-105 transition-transform"
                                      />
                                      <div className="truncate text-left">
                                        <p
                                          className="text-xs font-semibold text-slate-800 truncate"
                                          title={file.title || file.fileName}
                                        >
                                          {file.title || file.fileName}
                                        </p>
                                        <p className="text-[10px] text-slate-400 truncate">
                                          {file.fileName}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0 flex items-center gap-1">
                                      {downloadingFileId === file.id ? (
                                        <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <span>Descargar →</span>
                                      )}
                                    </span>
                                  </button>
                                ))}
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

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            className="px-6 py-2.5"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="success"
            className="px-6 py-2.5"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Guardar
          </Button>
        </div>
      </form>

      <ContactModal
        open={isClientModalOpen}
        executives={executives
          .filter((u) => u.id)
          .map((u) => ({ value: u.id!, label: u.username }))}
        companies={companies
          .filter((c) => c.id)
          .map((c) => ({ value: c.id!, label: c.nombre }))}
        onClose={() => setIsClientModalOpen(false)}
        onSubmit={async (data) => {
          await handleCreateClient(data as Client);
        }}
      />
    </>
  );
};

export default OpportunityForm;
