
import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  show: boolean;
}

const iconMap = {
  success: {
    icon: <CheckCircle className="h-10 w-10 text-green-600" />,
    bg: 'bg-green-100',
  },
  error: {
    icon: <XCircle className="h-10 w-10 text-red-600" />,
    bg: 'bg-red-100',
  },
  warning: {
    icon: <AlertTriangle className="h-10 w-10 text-yellow-600" />,
    bg: 'bg-yellow-100',
  },
  confirmation: {
    icon: <AlertTriangle className="h-10 w-10 text-yellow-600" />,
    bg: 'bg-yellow-100',
  },
};

const Notification: React.FC<NotificationProps> = ({ type, title, message, onConfirm, onCancel, show }) => {
  if (!show) {
    return null;
  }
  const { icon, bg } = iconMap[type];

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl transform transition-all max-w-sm w-full animate-fade-in-down">
        <div className="p-6 text-center">
          <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full ${bg}`}>
            {icon}
          </div>
          <h3 className="mt-5 text-2xl font-bold leading-6 text-gray-900">{title}</h3>
          <div className="mt-3">
            <p className="text-md text-gray-600">{message}</p>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
          {type === 'confirmation' && (
            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button
                onClick={onConfirm}
                type="button"
                className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm transition-colors"
              >
                Sí, continuar
              </button>
              <button
                onClick={onCancel}
                type="button"
                className="w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
          {type !== 'confirmation' && (
            <div className="flex justify-center">
              <button
                onClick={onConfirm}
                type="button"
                className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm transition-colors"
              >
                Aceptar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;
