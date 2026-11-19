import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@core/axios/axiosInstance';
import { auth } from '@/global/endpoints';
import { useFormValidation } from '@shared/hooks/useFormValidation';
import { validateWithSchema } from '@shared/utils/yupValidation';
import {
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from '../schemas/auth.schema';

export function useForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const {
    errors: fieldErrors,
    setErrors: setFieldErrors,
    clearError: clearFieldError,
  } = useFormValidation<ForgotPasswordFormData>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { isValid, errors } = await validateWithSchema(forgotPasswordValidationSchema, {
      email,
    });
    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(auth.FORGOT_PASSWORD, { email: email.trim() });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al procesar la solicitud';
      setError(msg === 'User not found' ? 'El correo no está registrado' : msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    loading,
    error,
    setError,
    fieldErrors,
    clearFieldError,
    success,
    handleSubmit,
    navigate,
  };
}

export function useResetPassword(token: string | null) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const {
    errors: fieldErrors,
    setErrors: setFieldErrors,
    clearError: clearFieldError,
  } = useFormValidation<ResetPasswordFormData>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { isValid, errors } = await validateWithSchema(resetPasswordValidationSchema, {
      password,
      confirmPassword,
    });
    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    if (!token) {
      setError('Token de recuperación faltante');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(auth.RESET_PASSWORD, { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    loading,
    error,
    setError,
    fieldErrors,
    clearFieldError,
    success,
    handleSubmit,
    navigate,
  };
}
