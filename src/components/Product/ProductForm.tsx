import React, { useState, useEffect } from 'react';
import type { Product } from '../../core/models/Product';
import { UploadCloud, X, DollarSign, Paperclip, Tag } from 'lucide-react';

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
  const [dragOver, setDragOver] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setStagedCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setStagedCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
      }
    }
  };

  const removeCover = () => {
    setStagedCoverFile(null);
    setCoverPreview(null);
    setFormData(prev => ({ ...prev, imagenPortada: null }));
  };

  const handleSpecFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newStaged = Array.from(e.target.files).map((file, idx) => {
        const defaultTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        return {
          id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          file,
          title: defaultTitle,
        };
      });
      setStagedSpecs(prev => [...prev, ...newStaged]);
    }
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
            <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Licencia Anual Qlik Sense"
              required
              className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-semibold text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion || ''}
              onChange={handleChange}
              placeholder="Describe las características principales del producto..."
              rows={3}
              className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          <div>
            <label htmlFor="precioBase" className="block text-sm font-semibold text-gray-700 mb-1">
              Precio Base (MXN) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <DollarSign size={16} />
              </span>
              <input
                id="precioBase"
                type="number"
                name="precioBase"
                min="0"
                step="0.01"
                value={formData.precioBase}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full border rounded pl-8 pr-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-right bg-white"
              />
            </div>
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
            <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm flex flex-col items-center justify-center relative h-64 w-full">
              <button
                type="button"
                onClick={removeCover}
                className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-full transition-colors"
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
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 h-64 flex flex-col items-center justify-center ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <input
                type="file"
                id="product-cover-upload"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="product-cover-upload" className="cursor-pointer flex flex-col items-center select-none w-full">
                <UploadCloud size={40} className="text-indigo-500 mb-2 animate-bounce-slow" />
                <span className="text-sm font-semibold text-slate-700">Sube la imagen del producto</span>
                <span className="text-xs text-slate-400 mt-1">Arrastra y suelta o haz clic para buscar</span>
                <span className="mt-4 inline-flex items-center text-[12px] bg-white border border-slate-200 text-indigo-600 px-3 py-1.5 rounded-lg font-semibold shadow-sm hover:bg-indigo-50 transition-colors">
                  Buscar imagen
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Attachments Section ONLY in creation mode */}
      {!initialData && (
        <fieldset className="space-y-4 border-t border-gray-150 pt-6">
          <legend className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
            Fichas Técnicas y Documentos (Opcional)
          </legend>
          
          <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/30 text-center hover:bg-slate-50 transition-all">
            <input
              type="file"
              id="product-specs-upload-create"
              className="hidden"
              onChange={handleSpecFileChange}
              multiple
            />
            <label htmlFor="product-specs-upload-create" className="cursor-pointer flex flex-col items-center w-full">
              <UploadCloud size={30} className="text-indigo-400 mb-1" />
              <span className="text-xs font-semibold text-slate-700">
                Selecciona o arrastra documentos técnicos aquí para guardarlos con el producto
              </span>
            </label>
          </div>

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
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-150 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm"
        >
          Guardar Producto
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
