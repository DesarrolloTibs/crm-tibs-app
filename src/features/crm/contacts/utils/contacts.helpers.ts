import * as yup from 'yup';
import type {
  Client,
  ContactFormData,
  ContactFiltersState,
  ContactStats,
} from '../schemas/contacts.schema';
import { contactValidationSchema } from '../schemas/contacts.schema';
import { ClientCategory } from '@core/models/Client';

export const INITIAL_CONTACT_FORM: ContactFormData = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  puesto: '',
  category: ClientCategory.CONTACTO,
  ejecutivo_id: '',
  companyId: null,
  empresa: '',
  estatus: true,
};

/**
 * Valida de forma asíncrona los datos de un contacto contra el esquema Yup
 */
export const validateContactForm = async (
  values: Partial<ContactFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await contactValidationSchema.validate(values, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      err.inner.forEach((error) => {
        if (error.path && !errors[error.path]) {
          errors[error.path] = error.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { form: 'Error de validación inesperado' } };
  }
};

/**
 * Calcula las métricas KPI del catálogo de contactos
 */
export const calculateContactStats = (clients: Client[]): ContactStats => {
  const total = clients.length;
  let active = 0;
  let inactive = 0;
  let withCompany = 0;
  let withoutCompany = 0;

  for (const client of clients) {
    if (client.estatus !== false) {
      active++;
    } else {
      inactive++;
    }

    if (client.companyId || (client.empresa && client.empresa.trim().length > 0)) {
      withCompany++;
    } else {
      withoutCompany++;
    }
  }

  return {
    total,
    active,
    inactive,
    withCompany,
    withoutCompany,
  };
};

/**
 * Normaliza y filtra la colección de contactos según los criterios activos
 */
export const filterContacts = (
  clients: Client[],
  filters: ContactFiltersState
): Client[] => {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return clients.filter((client) => {
    // Coincidencia por búsqueda libre (nombre, apellido, correo, teléfono, empresa, puesto)
    const fullName = `${client.nombre || ''} ${client.apellido || ''}`.toLowerCase();
    const email = (client.correo || '').toLowerCase();
    const phone = (client.telefono || '').toLowerCase();
    const company = (client.company?.nombre || client.empresa || '').toLowerCase();
    const role = (client.puesto || '').toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      fullName.includes(normalizedSearch) ||
      email.includes(normalizedSearch) ||
      phone.includes(normalizedSearch) ||
      company.includes(normalizedSearch) ||
      role.includes(normalizedSearch);

    // Coincidencia por estado
    const isClientActive = client.estatus !== false;
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && isClientActive) ||
      (filters.status === 'inactive' && !isClientActive);

    // Coincidencia por categoría
    const matchesCategory =
      filters.category === 'all' || client.category === filters.category;

    // Coincidencia por ejecutivo responsable
    const matchesExecutive =
      filters.ejecutivoId === 'all' || client.ejecutivo_id === filters.ejecutivoId;

    // Coincidencia por empresa
    const matchesCompany =
      filters.companyId === 'all' || client.companyId === filters.companyId;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory &&
      matchesExecutive &&
      matchesCompany
    );
  });
};
