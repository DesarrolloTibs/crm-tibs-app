import React, { useState, useEffect } from 'react';
import type { Product } from '../../core/models/Product';
import { UploadCloud, X, DollarSign, Paperclip, Tag } from 'lucide-react';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Button from '../shared/Button';
import Dropzone from '../shared/Dropzone';

interface StagedSpecFile {
  id: string;
  file: File;
  title: string;
}

interface Props {
  initialData?: Product;
  onSubmit: (product: Partial<Product>, stagedCoverFile: File | null, stagedSpecs: StagedSpecFile[]) => void;
  onCancel: () => void;
}

interface ProductFormState {
  nombre: string;
  descripcion: string;
  precioBase: string;
  status: boolean;
  imagenPortada?: string | null;
}

const ProductForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
  const baseUrl = import.meta.env.VITE_BASE_URL || '';

  const [formData, setFormData] = useState<ProductFormState>({
    nombre: '',
    descripcion: '',
    precioBase: '',
    status: true,
  });

  const [stagedCoverFile, setStagedCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Staged technical specs for product creation
  const [stagedSpecs, setStagedSpecs] = useState<StagedSpecFile[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        precioBase: initialData.precioBase !== undefined && initialData.precioBase !== null ? String(initialData.precioBase) : '',
        status: initialData.status !== undefined ? initialData.status : true,
        imagenPortada: initialData.imagenPortada,
      });

      if (initialData.imagenPortada) {
        setCoverPreview(`${baseUrl}${initialData.imagenPortada}`);
      } else {
        setCoverPreview(null);
      }
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        precioBase: '',
        status: true,
        imagenPortada: null,
      });
      setCoverPreview(null);
    }
    setStagedCoverFile(null);
    setStagedSpecs([]);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const removeCover = () => {
    setStagedCoverFile(null);
    setCoverPreview(null);
    setFormData(prev => ({ ...prev, imagenPortada: null }));
  };

  const removeStagedSpec = (id: string) => {
    setStagedSpecs(prev => prev.filter(f => f.id !== id));
  };

  const updateStagedSpecTitle = (id: string, value: string) => {
    setStagedSpecs(prev => prev.map(f => f.id === id ? { ...f, title: value } : f));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre?.trim()) {
      alert('Por favor, ingresa el nombre del producto.');
      return;
    }

    const parsedData: Partial<Product> = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precioBase: formData.precioBase !== '' ? Number(formData.precioBase) : 0,
      status: formData.status,
      imagenPortada: formData.imagenPortada,
    };

    onSubmit(parsedData, stagedCoverFile, stagedSpecs);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2">
      <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-3">
        {initialData ? 'Editar Producto' : 'Nuevo Producto'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left side: Information fields */}
        <div className="space-y-4">
          <div>
            <Input
              label="Nombre del Producto *"
              id="nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Licencia Anual Qlik Sense"
              required
            />
          </div>

          <div>
            <TextArea
              label="Descripción"
              id="descripcion"
              name="descripcion"
              value={formData.descripcion || ''}
              onChange={handleChange}
              placeholder="Describe las características principales del producto..."
              rows={3}
            />
          </div>

          <div>
            <Input
              label="Precio Base (MXN) *"
              id="precioBase"
              type="number"
              name="precioBase"
              min="0"
              step="0.01"
              value={formData.precioBase}
              onChange={handleChange}
              placeholder="0.00"
              inputPrefix={<DollarSign size={16} />}
              className="text-right"
            />
            <span className="text-xs text-slate-400 mt-1 block">
              El precio base del catálogo se calcula y almacena estrictamente en Pesos Mexicanos (MXN).
            </span>
          </div>

          <div className="flex items-center mt-2">
            <label className="inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                name="status"
                checked={formData.status}
                onChange={handleChange}
                className="form-checkbox text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300 rounded cursor-pointer"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Producto Activo / Disponible</span>
            </label>
          </div>
        </div>

        {/* Right side: Cover Image Upload */}
        <div className="flex flex-col">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Imagen de Portada</label>
          
          {coverPreview ? (
            <div className="border border-slate-200 rounded-2xl p-3 bg-white shadow-sm flex flex-col items-center justify-center relative h-64 w-full">
              <button
                type="button"
                onClick={removeCover}
                className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-full transition-colors cursor-pointer"
                title="Quitar portada"
              >
                <X size={16} />
              </button>
              <img
                src={coverPreview}
                alt="Vista previa de portada"
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : (
            <Dropzone
              id="product-cover-upload"
              accept="image/*"
              onFilesSelected={(files) => {
                if (files.length > 0) {
                  setStagedCoverFile(files[0]);
                  setCoverPreview(URL.createObjectURL(files[0]));
                }
              }}
              helpText="Sube la imagen del producto"
              buttonText="Buscar imagen"
              className="h-64"
            />
          )}
        </div>
      </div>

      {/* Attachments Section ONLY in creation mode */}
      {!initialData && (
        <fieldset className="space-y-4 border-t border-gray-150 pt-6">
          <legend className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
            Fichas Técnicas y Documentos (Opcional)
          </legend>
          
          <Dropzone
            id="product-specs-upload-create"
            multiple
            onFilesSelected={(files) => {
              const newStaged = files.map((file, idx) => {
                const defaultTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                return {
                  id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                  file,
                  title: defaultTitle,
                };
              });
              setStagedSpecs(prev => [...prev, ...newStaged]);
            }}
            helpText="Selecciona o arrastra documentos técnicos aquí para guardarlos con el producto"
            buttonText="Buscar documentos"
            icon={<UploadCloud size={24} className="text-indigo-400 mb-1 animate-bounce" style={{ animationDuration: '3s' }} />}
            className="min-h-[120px] py-4"
          />

          {stagedSpecs.length > 0 && (
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {stagedSpecs.map((sf) => (
                <div key={sf.id} className="p-3 border border-slate-100 bg-slate-50/60 rounded-xl relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 pr-6 max-w-md">
                    <Paperclip size={16} className="text-indigo-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate" title={sf.file.name}>
                      {sf.file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 flex-grow">
                      <Tag size={12} className="text-slate-400 mr-1 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Título / Etiqueta (Ej. Hoja Técnica)"
                        value={sf.title}
                        onChange={(e) => updateStagedSpecTitle(sf.id, e.target.value)}
                        className="text-xs w-full focus:outline-none text-slate-700 bg-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStagedSpec(sf.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </fieldset>
      )}

      <div className="flex justify-end space-x-2 border-t border-gray-100 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="success"
        >
          Guardar 
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
