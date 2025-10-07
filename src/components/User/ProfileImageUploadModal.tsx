import React, { useState, useCallback } from 'react';
import { uploadProfileImage } from '../../services/usersService';
import { Paperclip, UploadCloud, X } from 'lucide-react';
import type { User } from '../../core/models/User';
import Notification from '../Modal/Notification';

interface ProfileImageUploadModalProps {
  user: User;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const ProfileImageUploadModal: React.FC<ProfileImageUploadModalProps> = ({ user, onClose, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const hideNotification = () => setNotification({ ...notification, show: false });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !user.id) return;

    setUploading(true);
    try {
      await uploadProfileImage(user.id, selectedFile);
      setNotification({ show: true, type: 'success', title: '¡Éxito!', message: 'Imagen de perfil actualizada.', onConfirm: () => { hideNotification(); onUploadSuccess(); } });
    } catch (error) {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudo subir la imagen.', onConfirm: hideNotification });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <Notification {...notification} onCancel={hideNotification} />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Subir Imagen de Perfil</h2>
      <p className="text-gray-600 mb-6">Para el usuario: <span className="font-semibold">{user.username}</span></p>

      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
      >
        <input
          type="file"
          id="profile-image-upload"
          className="hidden"
          onChange={handleFileChange}
          accept=".png,.jpeg,.jpg"
        />
        <label htmlFor="profile-image-upload" className="cursor-pointer flex flex-col items-center">
          <UploadCloud size={48} className="text-gray-400 mb-2" />
          <span className="text-gray-600">Arrastra y suelta un archivo aquí</span>
          <span className="text-sm text-gray-500 mt-1">o</span>
          <span className="mt-2 text-blue-600 font-semibold">Selecciona un archivo</span>
        </label>
      </div>

      {selectedFile && (
        <div className="mt-4 flex items-center justify-between bg-gray-100 p-3 rounded-lg">
          <div className="flex items-center truncate"><Paperclip size={18} className="text-gray-600 mr-2 flex-shrink-0" /> <span className="text-sm text-gray-800 truncate">{selectedFile.name}</span></div>
          <button onClick={() => setSelectedFile(null)} className="p-1 text-gray-500 hover:text-red-600 rounded-full"><X size={18} /></button>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-6">
        <button type="button" onClick={onClose} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
        <button onClick={handleUpload} disabled={!selectedFile || uploading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">{uploading ? 'Subiendo...' : 'Subir Imagen'}</button>
      </div>
    </div>
  );
};

export default ProfileImageUploadModal;