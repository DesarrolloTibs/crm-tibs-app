import React, { useState, useMemo } from 'react';
import {
  uploadProductFile,
  downloadProductFile,
  deleteProductFile,
  getProduct,
} from '@core/services/productsService';
import {
  Paperclip,
  X,
  Tag,
  FolderOpen,
} from 'lucide-react';
import type { Product, ProductFile } from '@core/models/Product';
import Notification from '@shared/components/Notification';
import Dropzone from '@shared/components/Dropzone';
import Table from '@shared/components/Table';
import Input from '@shared/components/Input';
import Button from '@shared/components/Button';
import {
  buildFileAttachmentColumns,
  getFileAttachmentIcon,
} from '@shared/utils/fileAttachments';

interface ProductFilesTabProps {
  product: Product;
  onUploadSuccess: (updatedProduct: Product) => void;
}

interface StagedFile {
  id: string;
  file: File;
  title: string;
}

const ProductFilesTab: React.FC<ProductFilesTabProps> = ({ product, onUploadSuccess }) => {
  const [currentProduct, setCurrentProduct] = useState<Product>(product);
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

  React.useEffect(() => {
    setCurrentProduct(product);
  }, [product]);

  React.useEffect(() => {
    let active = true;
    const fetchLatestFiles = async () => {
      if (!product.id) return;
      setLoadingFiles(true);
      try {
        const latestProduct = await getProduct(product.id);
        if (active) {
          setCurrentProduct(latestProduct);
          onUploadSuccess(latestProduct);
        }
      } catch (err) {
        console.error('Error al cargar archivos del producto:', err);
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
  }, [product.id, onUploadSuccess]);

  const addFilesToStaged = (files: File[]) => {
    const newStaged: StagedFile[] = files.map((file, idx) => {
      const defaultTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      return {
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        title: defaultTitle,
      };
    });
    setStagedFiles(prev => [...prev, ...newStaged]);
  };

  const updateStagedFile = (id: string, value: string) => {
    setStagedFiles(prev => prev.map(sf => (sf.id === id ? { ...sf, title: value } : sf)));
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(sf => sf.id !== id));
  };

  const handleUploadAll = async () => {
    if (stagedFiles.length === 0 || !currentProduct.id) return;

    setUploading(true);
    setNotification({
      show: true,
      type: 'loading',
      title: 'Subiendo archivos...',
      message: `Subiendo ${stagedFiles.length} archivo(s) técnico(s) al servidor...`,
      onConfirm: () => {},
      onCancel: () => {},
    });
    try {
      let lastUpdatedProduct = currentProduct;
      for (const sf of stagedFiles) {
        lastUpdatedProduct = await uploadProductFile(currentProduct.id, sf.file, sf.title);
      }
      onUploadSuccess(lastUpdatedProduct);
      setStagedFiles([]);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: `${stagedFiles.length} archivo(s) subido(s) correctamente al producto.`,
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } catch (error) {
      console.error('Upload product files error:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudieron subir todos los archivos al servidor.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: ProductFile) => {
    if (!currentProduct.id) return;
    setDownloadingFileId(file.id);
    try {
      const blob = await downloadProductFile(currentProduct.id, file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download file error:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo descargar el archivo.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleDeleteConfirm = (file: ProductFile) => {
    setNotification({
      show: true,
      type: 'confirmation',
      title: '¿Eliminar archivo?',
      message: `¿Estás seguro de que deseas eliminar el archivo "${file.fileName}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        if (!currentProduct.id) return;
        setDeletingFileId(file.id);
        setNotification({
          show: true,
          type: 'loading',
          title: 'Eliminando archivo...',
          message: `Eliminando "${file.fileName}" del producto...`,
          onConfirm: () => {},
          onCancel: () => {},
        });
        try {
          const updatedProduct = await deleteProductFile(currentProduct.id, file.id);
          onUploadSuccess(updatedProduct);
          setNotification({
            show: true,
            type: 'success',
            title: '¡Eliminado!',
            message: 'El archivo técnico se ha eliminado correctamente.',
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
        } catch (error) {
          console.error('Delete file error:', error);
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

  const filesList = currentProduct.files || [];

  const fileColumns = useMemo(
    () =>
      buildFileAttachmentColumns<ProductFile>({
        dateHeader: 'Fecha de Carga',
        getDateValue: (file) => file.uploadedAt,
        downloadingFileId,
        deletingFileId,
        onDownload: handleDownload,
        onDelete: handleDeleteConfirm,
      }),
    [downloadingFileId, deletingFileId, currentProduct.id]
  );

  return (
    <div className="p-4 flex flex-col h-full max-h-[70vh] overflow-y-auto">
      <Notification {...notification} />

      {/* Drag & Drop Zone */}
      <Dropzone
        id="product-file-attachments-upload"
        multiple
        onFilesSelected={addFilesToStaged}
        helpText="Arrastra fichas técnicas o documentos aquí o haz clic para explorar"
        buttonText="Seleccionar archivos"
      />

      {/* Queue of Staged Files */}
      {stagedFiles.length > 0 && (
        <div className="mt-6 border border-slate-200 rounded-xl p-4 bg-white shadow-sm animate-fade-in">
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <Paperclip size={16} className="text-indigo-500" />
            Archivos por subir ({stagedFiles.length})
          </h4>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
            {stagedFiles.map(sf => (
              <div
                key={sf.id}
                className="p-3 border border-slate-100 bg-slate-50/60 rounded-xl relative flex flex-col gap-2"
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

                <Input
                  size="sm"
                  type="text"
                  placeholder="Etiqueta / Título (ej. Hoja Técnica)"
                  value={sf.title}
                  onChange={e => updateStagedFile(sf.id, e.target.value)}
                  inputPrefix={<Tag size={14} />}
                  containerClassName="max-w-md"
                  className="bg-white rounded-lg"
                />
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
      <div className="mt-6 flex-grow">
        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <FolderOpen size={16} className="text-indigo-500" />
          Fichas técnicas y documentos ({filesList.length})
        </h4>

        <Table<ProductFile>
          columns={fileColumns}
          data={filesList}
          variant="flat"
          loading={loadingFiles && filesList.length === 0}
          maxHeight="300px"
          minHeight="0px"
          keyExtractor={(file) => file.id}
          emptyTitle="No hay archivos en este producto"
          emptyMessage="Utiliza la zona superior para cargar PDFs u hojas técnicas."
          enablePagination
          initialPageSize={10}
        />
      </div>
    </div>
  );
};

export default ProductFilesTab;
