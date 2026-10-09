import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../core/axios/axiosInstance';
import { auth } from '../global/endpoints';

export function useForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post(auth.FORGOT_PASSWORD, { email });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al procesar la solicitud';
      setError(msg === 'User not found' ? 'El correo no está registrado' : msg);
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, loading, error, setError, success, handleSubmit, navigate };
}

export function useResetPassword(token: string | null) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    if (!token) { setError('Token de recuperación faltante'); return; }
    setLoading(true);
    setError('');
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
    password, setPassword, confirmPassword, setConfirmPassword,
    showPassword, setShowPassword, loading, error, setError, success,
    handleSubmit, navigate,
  };
}
