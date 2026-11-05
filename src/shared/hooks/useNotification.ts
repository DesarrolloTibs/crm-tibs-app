import { useState, useCallback } from 'react';
import { showToast } from '@shared/utils/toast';

export type NotificationType = 'loading' | 'success' | 'error' | 'warning' | 'confirmation';

export interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const DEFAULT_STATE: NotificationState = {
  show: false,
  type: 'success',
  title: '',
  message: '',
};

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>(DEFAULT_STATE);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  const showLoading = useCallback(
    (
      message: string = 'Guardando los cambios, por favor espera...',
      title: string = 'Procesando...',
    ) => {
      setNotification({
        show: true,
        type: 'loading',
        title,
        message,
        onConfirm: undefined,
        onCancel: undefined,
      });
    },
    [],
  );

  const showSuccess = useCallback((message: string, title: string = '¡Éxito!') => {
    setNotification(prev => (prev.show ? { ...prev, show: false } : prev));
    showToast.success(message, title);
  }, []);

  const showError = useCallback((message: string, title: string = 'Error') => {
    setNotification(prev => (prev.show ? { ...prev, show: false } : prev));
    showToast.error(message, title);
  }, []);

  const showWarning = useCallback((message: string, title: string = 'Advertencia') => {
    setNotification(prev => (prev.show ? { ...prev, show: false } : prev));
    showToast.warning(message, title);
  }, []);

  const showConfirmation = useCallback(
    (params: {
      title: string;
      message: string;
      onConfirm: () => void | Promise<void>;
      onCancel?: () => void;
    }) => {
      setNotification({
        show: true,
        type: 'confirmation',
        title: params.title,
        message: params.message,
        onConfirm: () => {
          hideNotification();
          params.onConfirm();
        },
        onCancel: () => {
          hideNotification();
          params.onCancel?.();
        },
      });
    },
    [hideNotification],
  );

  return {
    notification,
    showLoading,
    showSuccess,
    showError,
    showWarning,
    showConfirmation,
    hideNotification,
  };
}

export default useNotification;
