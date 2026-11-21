import * as yup from 'yup';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/** Patrones compartidos de validación */
export const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;
export const PHONE_REGEX = /^[0-9+\s().-]*$/;
export const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const HHMM_TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/** Valida que un número tenga como máximo 2 posiciones decimales */
export const hasAtMostTwoDecimals = (val?: number | null): boolean => {
  if (val === undefined || val === null || Number.isNaN(val)) return true;
  const str = String(val);
  if (str.includes('e') || str.includes('E')) {
    return Math.abs(val * 100 - Math.round(val * 100)) < 1e-8;
  }
  const decimalPart = str.split('.')[1];
  return !decimalPart || decimalPart.length <= 2;
};

/**
 * Ejecuta un esquema Yup con `abortEarly: false` y devuelve un diccionario `{ campo: mensaje }`.
 */
export const validateWithSchema = async <T extends yup.AnyObjectSchema>(
  schema: T,
  values: unknown
): Promise<ValidationResult> => {
  try {
    await schema.validate(values, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      err.inner.forEach((error) => {
        if (error.path && !errors[error.path]) {
          errors[error.path] = error.message;
        }
      });
      if (Object.keys(errors).length === 0 && err.message) {
        errors[err.path || 'form'] = err.message;
      }
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { form: 'Error de validación inesperado' } };
  }
};

/** Transforma cadena vacía o solo espacios en null */
export const emptyStringToNull = (curr: unknown, orig: unknown) =>
  orig === '' || orig === null || orig === undefined || !curr ? null : curr;

/** Campo opcional de correo electrónico con límite de longitud */
export const optionalEmailField = (
  maxLen = 100,
  message = 'Ingresa un correo electrónico válido'
) =>
  yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .transform(emptyStringToNull)
    .email(message)
    .max(maxLen, `El correo no puede exceder los ${maxLen} caracteres`);

/** Campo opcional de teléfono con validación de caracteres y mínimo de 7 dígitos reales */
export const optionalPhoneField = (maxLen = 25) =>
  yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .transform(emptyStringToNull)
    .matches(PHONE_REGEX, 'El formato de teléfono contiene caracteres no permitidos')
    .test(
      'min-phone-digits',
      'El teléfono debe contener al menos 7 dígitos',
      (val) => !val || val.replace(/\D/g, '').length >= 7
    )
    .max(maxLen, `El teléfono no puede exceder ${maxLen} caracteres`);

/** Campo opcional de URL HTTP/HTTPS */
export const optionalHttpUrlField = (maxLen = 150) =>
  yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .transform(emptyStringToNull)
    .max(maxLen, `La URL no puede exceder ${maxLen} caracteres`)
    .test(
      'is-valid-http-url',
      'La URL debe incluir un formato válido (ej. https://ejemplo.com)',
      (val) => {
        if (!val) return true;
        try {
          const parsed = new URL(val);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      }
    );
