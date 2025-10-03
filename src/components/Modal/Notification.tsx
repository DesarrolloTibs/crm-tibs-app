
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
  success: <CheckCircle className="h-6 w-6 text-green-400" />,
  error: <XCircle className="h-6 w-6 text-red-400" />,
  warning: <AlertTriangle className="h-6 w-6 text-yellow-400" />,
  confirmation: <AlertTriangle className="h-6 w-6 text-yellow-400" />,
};

const Notification: React.FC<NotificationProps> = ({ type, title, message, onConfirm, onCancel, show }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl m-4 max-w-sm w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {iconMap[type]}
            <h3 className="ml-3 text-lg leading-6 font-medium text-gray-900">{title}</h3>
          </div>
          {type !== 'confirmation' && (
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-500">{message}</p>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          {type === 'confirmation' && (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sí, ¡elimínala!
              </button>
            </>
          )}
          {type !== 'confirmation' && (
             <button
             onClick={onConfirm}
             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
           >
             Aceptar
           </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;
