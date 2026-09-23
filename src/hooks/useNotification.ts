import { useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'confirmation';

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
    setNotification((prev) => ({ ...prev, show: false }));
  }, []);

  const showSuccess = useCallback((message: string, title: string = '¡Éxito!') => {
    setNotification({
      show: true,
      type: 'success',
      title,
      message,
      onConfirm: hideNotification,
      onCancel: hideNotification,
    });
  }, [hideNotification]);

  const showError = useCallback((message: string, title: string = 'Error') => {
    setNotification({
      show: true,
      type: 'error',
      title,
      message,
      onConfirm: hideNotification,
      onCancel: hideNotification,
    });
  }, [hideNotification]);

  const showWarning = useCallback((message: string, title: string = 'Advertencia') => {
    setNotification({
      show: true,
      type: 'warning',
      title,
      message,
      onConfirm: hideNotification,
      onCancel: hideNotification,
    });
  }, [hideNotification]);

  const showConfirmation = useCallback((params: {
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
  }, [hideNotification]);

  return {
    notification,
    showSuccess,
    showError,
    showWarning,
    showConfirmation,
    hideNotification,
  };
}

export default useNotification;
