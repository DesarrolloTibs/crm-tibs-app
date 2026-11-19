import * as yup from 'yup';
import { PASSWORD_STRENGTH_REGEX, USERNAME_REGEX } from '@shared/utils/yupValidation';

/**
 * Construye el esquema Yup para alta o edición de usuarios.
 * Al crear, `password` es obligatoria (mínimo 8 caracteres, letras y números).
 * Al editar, si `password` queda vacío se ignora; si se captura, exige la misma fortaleza.
 */
export const createUserValidationSchema = (isEditing: boolean) =>
  yup.object().shape({
    username: yup
      .string()
      .trim()
      .required('El nombre de usuario es obligatorio')
      .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
      .max(50, 'El nombre de usuario no puede exceder los 50 caracteres')
      .matches(
        USERNAME_REGEX,
        'Solo se permiten letras, números, puntos, guiones y guiones bajos (sin espacios)'
      ),
    email: yup
      .string()
      .trim()
      .required('El correo electrónico es obligatorio')
      .email('Ingresa un correo electrónico válido')
      .max(100, 'El correo no puede exceder los 100 caracteres'),
    password: yup
      .string()
      .transform((curr, orig) => (orig === '' ? undefined : curr))
      .when([], {
        is: () => !isEditing,
        then: (schema) =>
          schema
            .required('La contraseña es obligatoria')
            .min(8, 'La contraseña debe tener al menos 8 caracteres')
            .max(100, 'La contraseña no puede exceder los 100 caracteres')
            .matches(
              PASSWORD_STRENGTH_REGEX,
              'La contraseña debe incluir al menos una letra y un número'
            ),
        otherwise: (schema) =>
          schema
            .notRequired()
            .min(8, 'Si cambias la contraseña debe tener al menos 8 caracteres')
            .max(100, 'La contraseña no puede exceder los 100 caracteres')
            .matches(
              PASSWORD_STRENGTH_REGEX,
              'La contraseña debe incluir al menos una letra y un número'
            ),
      }),
    role: yup
      .string()
      .oneOf(['superadmin', 'admin', 'executive'], 'Selecciona un rol válido')
      .required('El rol es obligatorio'),
  });

export interface UserFormValues {
  username: string;
  email: string;
  password?: string;
  role: 'superadmin' | 'admin' | 'executive';
}
