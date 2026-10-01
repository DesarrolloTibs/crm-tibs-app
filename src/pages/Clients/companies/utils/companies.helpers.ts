import * as yup from 'yup';
import type {
  Company,
  CompanyFormData,
  CompanyFiltersState,
  CompanyStats,
} from '../schemas/companies.schema';
import { companyValidationSchema } from '../schemas/companies.schema';

export const INITIAL_COMPANY_FORM: CompanyFormData = {
  nombre: '',
  correo: '',
  telefono: '',
  website: '',
  direccion: '',
  ejecutivo_id: null,
  estatus: true,
};

/**
 * Valida de forma asíncrona un formulario de empresa contra el esquema Yup
 */
export const validateCompanyForm = async (
  values: Partial<CompanyFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await companyValidationSchema.validate(values, { abortEarly: false });
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
 * Calcula las métricas KPI del catálogo de empresas / cuentas B2B
 */
export const calculateCompanyStats = (companies: Company[]): CompanyStats => {
  const total = companies.length;
  let active = 0;
  let inactive = 0;
  let withContacts = 0;

  for (const company of companies) {
    if (company.estatus !== false) {
      active++;
    } else {
      inactive++;
    }

    if (Array.isArray(company.contacts) && company.contacts.length > 0) {
      withContacts++;
    }
  }

  return {
    total,
    active,
    inactive,
    withContacts,
  };
};

/**
 * Normaliza y filtra la colección de empresas según los criterios activos
 */
export const filterCompanies = (
  companies: Company[],
  filters: CompanyFiltersState
): Company[] => {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return companies.filter((company) => {
    // Coincidencia por texto (nombre, correo, teléfono, website, dirección)
    const name = (company.nombre || '').toLowerCase();
    const email = (company.correo || '').toLowerCase();
    const phone = (company.telefono || '').toLowerCase();
    const website = (company.website || '').toLowerCase();
    const address = (company.direccion || '').toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      name.includes(normalizedSearch) ||
      email.includes(normalizedSearch) ||
      phone.includes(normalizedSearch) ||
      website.includes(normalizedSearch) ||
      address.includes(normalizedSearch);

    // Coincidencia por estado
    const isCompanyActive = company.estatus !== false;
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && isCompanyActive) ||
      (filters.status === 'inactive' && !isCompanyActive);

    // Coincidencia por ejecutivo responsable
    const matchesExecutive =
      filters.ejecutivoId === 'all' || company.ejecutivo_id === filters.ejecutivoId;

    return matchesSearch && matchesStatus && matchesExecutive;
  });
};
