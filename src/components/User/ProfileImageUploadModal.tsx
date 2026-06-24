import React, { useState } from 'react';
import { uploadProfileImage } from '../../services/usersService';
import { Paperclip, X } from 'lucide-react';
import type { User } from '../../core/models/User';
import Notification from '../Modal/Notification';
import Dropzone from '../shared/Dropzone';
import Button from '../shared/Button';

interface ProfileImageUploadModalProps {
  user: User;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const ProfileImageUploadModal: React.FC<ProfileImageUploadModalProps> = ({ user, onClose, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const hideNotification = () => setNotification({ ...notification, show: false });

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

      <Dropzone
        id="profile-image-upload"
        accept=".png,.jpeg,.jpg"
        onFilesSelected={(files) => {
          if (files && files[0]) {
            setSelectedFile(files[0]);
          }
        }}
        helpText="Arrastra y suelta tu foto aquí"
        buttonText="Seleccionar imagen"
      />

      {selectedFile && (
        <div className="mt-4 flex items-center justify-between bg-gray-100 p-3 rounded-lg">
          <div className="flex items-center truncate"><Paperclip size={18} className="text-gray-600 mr-2 flex-shrink-0" /> <span className="text-sm text-gray-800 truncate">{selectedFile.name}</span></div>
          <button onClick={() => setSelectedFile(null)} className="p-1 text-gray-500 hover:text-red-600 rounded-full"><X size={18} /></button>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-6">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleUpload} disabled={!selectedFile} loading={uploading} variant="primary">Subir Imagen</Button>
      </div>
    </div>
  );
};

export default ProfileImageUploadModal;