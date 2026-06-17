import React, { useState, useCallback } from 'react';
import { uploadOpportunityFile, downloadOpportunityFile, deleteOpportunityFile } from '../../services/opportunitiesService';
import { 
  Paperclip, 
  UploadCloud, 
  X, 
  FileText, 
  FileSpreadsheet, 
  FileArchive, 
  Image, 
  File, 
  Calendar, 
  Tag, 
  Download, 
  Trash2,
  FolderOpen
} from 'lucide-react';
import type { Opportunity, OpportunityFile } from '../../core/models/Opportunity';
import Notification from '../Modal/Notification';

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
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = () => setNotification((prev) => ({ ...prev, show: false }));

  // Helper to determine icon based on file extension
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const size = 20;
    if (['pdf'].includes(ext)) {
      return <FileText size={size} className="text-red-500 flex-shrink-0" />;
    }
    if (['doc', 'docx', 'odt'].includes(ext)) {
      return <FileText size={size} className="text-blue-500 flex-shrink-0" />;
    }
    if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) {
      return <FileSpreadsheet size={size} className="text-green-500 flex-shrink-0" />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <FileArchive size={size} className="text-yellow-600 flex-shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return <Image size={size} className="text-purple-500 flex-shrink-0" />;
    }
    return <File size={size} className="text-gray-500 flex-shrink-0" />;
  };

  // Add files to staging list
  const addFilesToStaged = (files: FileList) => {
    const today = new Date().toISOString().substring(0, 10);
    const newStaged: StagedFile[] = Array.from(files).map((file, idx) => {
      // Clean up filename to serve as a default title (without extension)
      const defaultTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      return {
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        title: defaultTitle,
        date: today,
      };
    });
    setStagedFiles((prev) => [...prev, ...newStaged]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToStaged(e.target.files);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToStaged(e.dataTransfer.files);
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

  // Update a staged file field
  const updateStagedFile = (id: string, field: 'title' | 'date', value: string) => {
    setStagedFiles((prev) =>
      prev.map((sf) => (sf.id === id ? { ...sf, [field]: value } : sf))
    );
  };

  // Remove file from staging list
  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((sf) => sf.id !== id));
  };

  // Upload all staged files sequentially
  const handleUploadAll = async () => {
    if (stagedFiles.length === 0) return;

    setUploading(true);
    try {
      let lastUpdatedOpportunity = opportunity;
      for (const sf of stagedFiles) {
        lastUpdatedOpportunity = await uploadOpportunityFile(opportunity.id, sf.file, sf.title, sf.date);
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
      console.error("Upload error:", error);
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
      const blob = await downloadOpportunityFile(opportunity.id, file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
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
        hideNotification();
        setDeletingFileId(file.id);
        try {
          const updatedOpportunity = await deleteOpportunityFile(opportunity.id, file.id);
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
          console.error("Delete error:", error);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin fecha';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateString);
      return d.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const filesList = opportunity.files || [];

  return (
    <div className="p-4 flex flex-col h-full max-h-[70vh] overflow-y-auto">
      <Notification {...notification} />

      {/* Drag & Drop Zone */}
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
          dragOver 
            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' 
            : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
        }`}
      >
        <input
          type="file"
          id="file-attachments-upload"
          className="hidden"
          onChange={handleFileChange}
          multiple
        />
        <label htmlFor="file-attachments-upload" className="cursor-pointer flex flex-col items-center select-none">
          <UploadCloud size={40} className="text-indigo-500 mb-2 animate-bounce-slow" />
          <span className="text-sm font-semibold text-slate-700">Arrastra y suelta tus archivos aquí</span>
          <span className="text-xs text-slate-400 mt-1">o haz clic para explorar en tu equipo</span>
          <span className="mt-2 inline-flex items-center text-[12px] bg-white border border-slate-200 text-indigo-600 px-3 py-1.5 rounded-lg font-semibold shadow-sm hover:bg-indigo-50 transition-colors">
            Seleccionar archivos
          </span>
        </label>
      </div>

      {/* Queue of Staged Files to Upload */}
      {stagedFiles.length > 0 && (
        <div className="mt-6 border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <Paperclip size={16} className="text-indigo-500" />
            Archivos por subir ({stagedFiles.length})
          </h4>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
            {stagedFiles.map((sf) => (
              <div key={sf.id} className="p-3 border border-slate-100 bg-slate-50/60 rounded-xl relative flex flex-col gap-2.5">
                <button 
                  onClick={() => removeStagedFile(sf.id)} 
                  className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-colors"
                  title="Quitar"
                >
                  <X size={16} />
                </button>
                
                <div className="flex items-center gap-2 pr-6">
                  {getFileIcon(sf.file.name)}
                  <span className="text-xs font-semibold text-slate-700 truncate" title={sf.file.name}>
                    {sf.file.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1">
                    <Tag size={14} className="text-slate-400 mr-1.5 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Título / Etiqueta"
                      value={sf.title}
                      onChange={(e) => updateStagedFile(sf.id, 'title', e.target.value)}
                      className="text-xs w-full focus:outline-none text-slate-700 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1">
                    <Calendar size={14} className="text-slate-400 mr-1.5 flex-shrink-0" />
                    <input
                      type="date"
                      value={sf.date}
                      onChange={(e) => updateStagedFile(sf.id, 'date', e.target.value)}
                      className="text-xs w-full focus:outline-none text-slate-700 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <button 
              onClick={() => setStagedFiles([])} 
              disabled={uploading}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs py-2 rounded-lg transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleUploadAll} 
              disabled={uploading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-lg transition-colors shadow-sm cursor-pointer disabled:bg-slate-300 flex items-center justify-center gap-1.5"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Subiendo...</span>
                </>
              ) : (
                <span>Subir todo ({stagedFiles.length})</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* List of Uploaded Files */}
      <div className="mt-6 flex-1">
        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <FolderOpen size={16} className="text-indigo-500" />
          Archivos adjuntos ({filesList.length})
        </h4>

        {filesList.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-white flex flex-col items-center">
            <FolderOpen size={36} className="text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-400">No hay archivos en esta oportunidad</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Usa la zona de arriba para subir documentos importantes</p>
          </div>
        ) : (
          <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3 pl-4">Archivo</th>
                    <th className="p-3">Título / Etiqueta</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3 pr-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filesList.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2 max-w-[200px] sm:max-w-[250px]">
                          {getFileIcon(file.fileName)}
                          <span className="font-semibold text-slate-700 truncate" title={file.fileName}>
                            {file.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 font-medium truncate max-w-[150px]">
                        {file.title || <span className="italic text-slate-400">Sin etiqueta</span>}
                      </td>
                      <td className="p-3 text-slate-500 font-medium">
                        {formatDate(file.date)}
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => handleDownload(file)}
                            disabled={downloadingFileId === file.id || deletingFileId === file.id}
                            className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Descargar archivo"
                          >
                            {downloadingFileId === file.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Download size={15} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(file)}
                            disabled={downloadingFileId === file.id || deletingFileId === file.id}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar archivo"
                          >
                            {deletingFileId === file.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesTab;
