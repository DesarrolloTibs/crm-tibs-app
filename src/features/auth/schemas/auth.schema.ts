import * as yup from 'yup';
import { PASSWORD_STRENGTH_REGEX } from '@shared/utils/yupValidation';

export const loginValidationSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required('El correo electrónico es obligatorio')
    .email('Ingresa un correo electrónico válido')
    .max(100, 'El correo no puede exceder los 100 caracteres'),
  password: yup
    .string()
    .required('La contraseña es obligatoria')
    .max(100, 'La contraseña no puede exceder los 100 caracteres'),
});

export type LoginFormData = yup.InferType<typeof loginValidationSchema>;

export const forgotPasswordValidationSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required('El correo electrónico es obligatorio')
    .email('Ingresa un correo electrónico válido')
    .max(100, 'El correo no puede exceder los 100 caracteres'),
});

export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordValidationSchema>;

export const resetPasswordValidationSchema = yup.object().shape({
  password: yup
    .string()
    .required('La nueva contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder los 100 caracteres')
    .matches(
      PASSWORD_STRENGTH_REGEX,
      'La contraseña debe incluir al menos una letra y un número'
    ),
  confirmPassword: yup
    .string()
    .required('Debes confirmar la contraseña')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
});

export type ResetPasswordFormData = yup.InferType<typeof resetPasswordValidationSchema>;
