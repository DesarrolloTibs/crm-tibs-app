import React, { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { uploadProposalDocument, downloadProposalDocument } from '../../services/opportunitiesService';
import { Paperclip, UploadCloud, X, FileText } from 'lucide-react';
import type { Opportunity } from '../../core/models/Opportunity';

interface ProposalTabProps {
  opportunity: Opportunity;
  onUploadSuccess: (updatedOpportunity: Opportunity) => void;
}

const ProposalTab: React.FC<ProposalTabProps> = ({ opportunity, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
    if (!selectedFile) {
      Swal.fire('Atención', 'Por favor, selecciona un archivo para subir.', 'warning');
      return;
    }

    setUploading(true);
    try {
      const updatedOpportunity = await uploadProposalDocument(opportunity.id, selectedFile);
      onUploadSuccess(updatedOpportunity);
      Swal.fire('¡Éxito!', 'Propuesta subida correctamente.', 'success');
      setSelectedFile(null);
    } catch (error) {
      Swal.fire('Error', 'No se pudo subir la propuesta.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadProposalDocument(opportunity.id);
      // Extraer el nombre del archivo de la ruta original si es posible
      const fileName = opportunity.proposalDocumentPath?.split(/[\\/]/).pop() || 'propuesta';
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName); // Establecer el nombre del archivo
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url); // Limpiar la URL del objeto
    } catch (error) {
      console.error("Download error:", error);
      Swal.fire('Error', 'No se pudo descargar la propuesta. Es posible que no exista o haya un problema con el servidor.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full max-h-[70vh]">
      {/* <h3 className="text-xl font-semibold text-gray-800 mb-4">Documento de Propuesta</h3> */}

      {opportunity.proposalDocumentPath && (
        <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg">
          <p className="text-sm font-semibold text-green-800">Propuesta actual:</p>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center text-blue-600 hover:underline mt-1 disabled:text-gray-500 disabled:cursor-wait"
          >
            <FileText size={18} className="mr-2" />
            {downloading ? 'Descargando...' : 'Ver/Descargar Propuesta'}
          </button>
        </div>
      )}

      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
      >
        <input
          type="file"
          id="proposal-upload"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        />
        <label htmlFor="proposal-upload" className="cursor-pointer flex flex-col items-center">
          <UploadCloud size={48} className="text-gray-400 mb-2" />
          <span className="text-gray-600">Arrastra y suelta un archivo aquí</span>
          <span className="text-sm text-gray-500 mt-1">o</span>
          <span className="mt-2 text-blue-600 font-semibold">Selecciona un archivo</span>
        </label>
      </div>

      {selectedFile && (
        <div className="mt-4 flex items-center justify-between bg-gray-100 p-3 rounded-lg">
          <div className="flex items-center">
            <Paperclip size={18} className="text-gray-600 mr-2" />
            <span className="text-sm text-gray-800">{selectedFile.name}</span>
          </div>
          <button onClick={() => setSelectedFile(null)} className="p-1 text-gray-500 hover:text-red-600 rounded-full">
            <X size={18} />
          </button>
        </div>
      )}

      <button onClick={handleUpload} disabled={!selectedFile || uploading} className="mt-6 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
        {uploading ? 'Subiendo...' : 'Subir Propuesta'}
      </button>
    </div>
  );
};

export default ProposalTab;