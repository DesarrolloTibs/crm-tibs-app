import React, { useState, useMemo } from 'react';
import {
  uploadOpportunityFile,
  downloadOpportunityFile,
  deleteOpportunityFile,
  getOpportunity,
} from '@core/services/opportunitiesService';
import {
  Paperclip,
  X,
  Calendar,
  Tag,
  FolderOpen,
} from 'lucide-react';
import type { Opportunity, OpportunityFile } from '@core/models/Opportunity';
import Notification from '@shared/components/Notification';
import Dropzone from '@shared/components/Dropzone';
import Table from '@shared/components/Table';
import Input from '@shared/components/Input';
import Button from '@shared/components/Button';
import {
  buildFileAttachmentColumns,
  getFileAttachmentIcon,
} from '@shared/utils/fileAttachments';

interface FilesTabProps {
  opportunity: Opportunity;
  onUploadSuccess: (updatedOpportunity: Opportunity) => void;
}

interface StagedFile {
  id: string;
  file: File;
  title: string;
  date: string;
}

const FilesTab: React.FC<FilesTabProps> = ({ opportunity, onUploadSuccess }) => {
  const [currentOpportunity, setCurrentOpportunity] = useState<Opportunity>(opportunity);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'loading' | 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));

  // Sincronizar el estado interno si el prop cambia
  React.useEffect(() => {
    setCurrentOpportunity(opportunity);
  }, [opportunity]);

  // Cargar los archivos actualizados desde el servidor al montar o cuando cambie la oportunidad
  React.useEffect(() => {
    let active = true;
    const fetchLatestFiles = async () => {
      setLoadingFiles(true);
      try {
        const latestOpp = await getOpportunity(opportunity.id);
        if (active) {
          setCurrentOpportunity(latestOpp);
          // Sincronizar con el estado del componente padre
          onUploadSuccess(latestOpp);
        }
      } catch (err) {
        console.error('Error al cargar archivos de la oportunidad:', err);
      } finally {
        if (active) {
          setLoadingFiles(false);
        }
      }
    };
    fetchLatestFiles();
    return () => {
      active = false;
    };
  }, [opportunity.id]);

  // Add files to staging list
  const addFilesToStaged = (files: File[]) => {
    const today = new Date().toISOString().substring(0, 10);
    const newStaged: StagedFile[] = files.map((file, idx) => {
      // Clean up filename to serve as a default title (without extension)
      const defaultTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      return {
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        title: defaultTitle,
        date: today,
      };
    });
    setStagedFiles(prev => [...prev, ...newStaged]);
  };

  // Update a staged file field
  const updateStagedFile = (id: string, field: 'title' | 'date', value: string) => {
    setStagedFiles(prev => prev.map(sf => (sf.id === id ? { ...sf, [field]: value } : sf)));
  };

  // Remove file from staging list
  const removeStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(sf => sf.id !== id));
  };

  // Upload all staged files sequentially
  const handleUploadAll = async () => {
    if (stagedFiles.length === 0) return;

    setUploading(true);
    setNotification({
      show: true,
      type: 'loading',
      title: 'Subiendo archivos...',
      message: `Subiendo ${stagedFiles.length} archivo(s) a la oportunidad...`,
      onConfirm: () => {},
      onCancel: () => {},
    });
    try {
      let lastUpdatedOpportunity = currentOpportunity;
      for (const sf of stagedFiles) {
        lastUpdatedOpportunity = await uploadOpportunityFile(
          currentOpportunity.id,
          sf.file,
          sf.title,
          sf.date,
        );
      }
      onUploadSuccess(lastUpdatedOpportunity);
      setStagedFiles([]);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: `${stagedFiles.length} archivo(s) subido(s) correctamente.`,
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudieron subir todos los archivos.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setUploading(false);
    }
  };

  // Download a single file
  const handleDownload = async (file: OpportunityFile) => {
    setDownloadingFileId(file.id);
    try {
      const blob = await downloadOpportunityFile(currentOpportunity.id, file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo descargar el archivo del servidor.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Delete a single file with confirmation
  const handleDeleteConfirm = (file: OpportunityFile) => {
    setNotification({
      show: true,
      type: 'confirmation',
      title: '¿Eliminar archivo?',
      message: `¿Estás seguro de que deseas eliminar el archivo "${file.fileName}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setDeletingFileId(file.id);
        setNotification({
          show: true,
          type: 'loading',
          title: 'Eliminando archivo...',
          message: `Eliminando "${file.fileName}" de la oportunidad...`,
          onConfirm: () => {},
          onCancel: () => {},
        });
        try {
          const updatedOpportunity = await deleteOpportunityFile(currentOpportunity.id, file.id);
          onUploadSuccess(updatedOpportunity);
          setNotification({
            show: true,
            type: 'success',
            title: '¡Eliminado!',
            message: 'El archivo se ha eliminado correctamente.',
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
        } catch (error) {
          console.error('Delete error:', error);
          setNotification({
            show: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo eliminar el archivo.',
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
        } finally {
          setDeletingFileId(null);
        }
      },
      onCancel: hideNotification,
    });
  };

  const filesList = currentOpportunity.files || [];

  const fileColumns = useMemo(
    () =>
      buildFileAttachmentColumns<OpportunityFile>({
        dateHeader: 'Fecha',
        getDateValue: (file) => file.date,
        downloadingFileId,
        deletingFileId,
        onDownload: handleDownload,
        onDelete: handleDeleteConfirm,
      }),
    [downloadingFileId, deletingFileId, currentOpportunity.id]
  );

  return (
    <div className="p-4 flex flex-col h-full max-h-[70vh] overflow-y-auto">
      <Notification {...notification} />

      {/* Drag & Drop Zone */}
      <Dropzone
        id="file-attachments-upload"
        multiple
        onFilesSelected={addFilesToStaged}
        helpText="Arrastra y suelta tus archivos aquí o haz clic para explorar en tu equipo"
        buttonText="Seleccionar archivos"
      />

      {/* Queue of Staged Files to Upload */}
      {stagedFiles.length > 0 && (
        <div className="mt-6 border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <Paperclip size={16} className="text-indigo-500" />
            Archivos por subir ({stagedFiles.length})
          </h4>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
            {stagedFiles.map(sf => (
              <div
                key={sf.id}
                className="p-3 border border-slate-100 bg-slate-50/60 rounded-xl relative flex flex-col gap-2.5"
              >
                <Button
                  variant="icon"
                  onClick={() => removeStagedFile(sf.id)}
                  className="absolute top-2.5 right-2.5 !p-1 hover:!text-red-500 !rounded-full"
                  title="Quitar"
                >
                  <X size={16} />
                </Button>

                <div className="flex items-center gap-2 pr-6">
                  {getFileAttachmentIcon(sf.file.name)}
                  <span
                    className="text-xs font-semibold text-slate-700 truncate"
                    title={sf.file.name}
                  >
                    {sf.file.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  <Input
                    size="sm"
                    type="text"
                    placeholder="Título / Etiqueta"
                    value={sf.title}
                    onChange={e => updateStagedFile(sf.id, 'title', e.target.value)}
                    inputPrefix={<Tag size={14} />}
                    className="bg-white rounded-lg"
                  />
                  <Input
                    size="sm"
                    type="date"
                    value={sf.date}
                    onChange={e => updateStagedFile(sf.id, 'date', e.target.value)}
                    inputPrefix={<Calendar size={14} />}
                    className="bg-white rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setStagedFiles([])}
              disabled={uploading}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200 shadow-none hover:translate-y-0"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="indigo"
              onClick={handleUploadAll}
              loading={uploading}
              loadingText="Subiendo..."
              className="flex-1 shadow-sm hover:translate-y-0"
            >
              Subir todo ({stagedFiles.length})
            </Button>
          </div>
        </div>
      )}

      {/* List of Uploaded Files */}
      <div className="mt-6 flex-1">
        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <FolderOpen size={16} className="text-indigo-500" />
          Archivos adjuntos ({filesList.length})
        </h4>

        <Table<OpportunityFile>
          columns={fileColumns}
          data={filesList}
          variant="flat"
          loading={loadingFiles && filesList.length === 0}
          maxHeight="300px"
          minHeight="0px"
          keyExtractor={(file) => file.id}
          emptyTitle="No hay archivos en esta oportunidad"
          emptyMessage="Usa la zona de arriba para subir documentos importantes."
          enablePagination
          initialPageSize={10}
        />
      </div>
    </div>
  );
};

export default FilesTab;
