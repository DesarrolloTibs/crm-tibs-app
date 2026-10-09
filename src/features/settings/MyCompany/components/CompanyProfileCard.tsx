import React, { useState } from 'react';
import {
  Building2, Upload, CheckCircle2, Image as ImageIcon,
  Lightbulb, ShieldCheck, Database
} from 'lucide-react';
import Button from '../../../../components/shared/Button';
import Badge from '../../../../components/shared/Badge';
import type { TenantConsumptionData } from '../schemas/myCompany.schema';
import { uploadTenantLogo } from '../../../../services/tenantsService';
import { useConfigStore } from '../../../../store/useConfigStore';

interface CompanyProfileCardProps {
  consumption: TenantConsumptionData | null;
  onLogoUpdated: (newLogoUrl: string | null) => void;
  onNotify: (notification: {
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
  }) => void;
}

export const CompanyProfileCard: React.FC<CompanyProfileCardProps> = ({
  consumption,
  onLogoUpdated,
  onNotify,
}) => {
  const { selectedTenant, setSelectedTenant } = useConfigStore();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(() => {
    const rawLogo = consumption?.logo || selectedTenant?.logo;
    if (!rawLogo) return null;
    const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3091';
    return rawLogo.startsWith('http') ? rawLogo : `${baseUrl}${rawLogo}`;
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3091';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    const targetTenantId = consumption?.tenant_id || selectedTenant?.id;
    if (!targetTenantId) {
      onNotify({
        type: 'error',
        title: 'Error de Identificación',
        message: 'No se identificó la organización actual para actualizar el logo.',
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const updatedTenant = await uploadTenantLogo(targetTenantId, logoFile);
      const newLogoUrl = updatedTenant.logo
        ? (updatedTenant.logo.startsWith('http') ? updatedTenant.logo : `${baseUrl}${updatedTenant.logo}`)
        : null;

      setLogoPreview(newLogoUrl);
      setLogoFile(null);
      onLogoUpdated(newLogoUrl);

      if (selectedTenant && selectedTenant.id === targetTenantId) {
        setSelectedTenant({
          ...selectedTenant,
          logo: updatedTenant.logo,
        });
      }

      onNotify({
        type: 'success',
        title: 'Logo Actualizado',
        message: 'El logotipo oficial de la empresa se ha actualizado correctamente.',
      });
    } catch (err) {
      console.error('Error al subir el logo:', err);
      onNotify({
        type: 'error',
        title: 'Error de Carga',
        message: 'Ocurrió un fallo al guardar la imagen de la empresa.',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* TARJETA 1: LOGO OFICIAL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ImageIcon size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Logo Oficial de la Empresa</h4>
              <p className="text-[11px] text-slate-400">Identidad gráfica proyectada en la plataforma</p>
            </div>
          </div>
        </div>

        {/* Preview del Logo */}
        <div className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all">
          {logoPreview ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-48 h-20 flex items-center justify-center p-2.5 bg-white rounded-xl shadow-xs border border-slate-200">
                <img
                  src={logoPreview}
                  alt="Logo de la empresa"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 size={12} /> Logo Activo
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-2 py-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <Building2 size={26} />
              </div>
              <p className="text-xs font-bold text-slate-700">Sin logo asignado</p>
              <p className="text-[11px] text-slate-400">Formatos recomendados: PNG, JPG o SVG</p>
            </div>
          )}
        </div>

        {/* Controles de Carga */}
        <div className="space-y-3 pt-1">
          <input
            type="file"
            id="logo-upload-input-modular"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex gap-2">
            <label
              htmlFor="logo-upload-input-modular"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-2xs"
            >
              <Upload size={14} />
              <span>{logoFile ? 'Cambiar Imagen' : 'Seleccionar Logo'}</span>
            </label>

            {logoFile && (
              <Button
                variant="indigo"
                onClick={handleUploadLogo}
                loading={uploadingLogo}
                className="!py-2 !px-4 text-xs font-bold shadow-xs"
              >
                Guardar
              </Button>
            )}
          </div>

          {logoFile && (
            <p className="text-[11px] text-indigo-600 font-semibold truncate">
              Archivo listo: {logoFile.name}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lightbulb size={14} className="text-amber-500 shrink-0" />
            <span>Este logo se proyectará automáticamente en la barra superior (Navbar).</span>
          </div>
        </div>
      </div>

      {/* TARJETA 2: INFORMACIÓN DE LA ORGANIZACIÓN / INSTANCIA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Información de la Organización</h4>
                <p className="text-[11px] text-slate-400">Datos del tenant e infraestructura multitenant</p>
              </div>
            </div>
            <Badge variant={consumption?.is_active ? 'success' : 'neutral'} size="sm">
              {consumption?.is_active ? 'Habilitada' : 'Inactiva'}
            </Badge>
          </div>

          <div className="divide-y divide-slate-100 text-xs mt-3">
            <div className="flex justify-between items-center py-2.5">
              <span className="text-slate-500 font-medium">Nombre de Organización:</span>
              <span className="font-bold text-slate-800 text-sm">
                {consumption?.tenant_name || selectedTenant?.name || 'Organización'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5">
              <span className="text-slate-500 font-medium">Esquema Multitenant:</span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px]">
                {consumption?.schema_name || selectedTenant?.schema_name || 'public'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5">
              <span className="text-slate-500 font-medium">Plan Contratado:</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>{consumption?.plan_name || 'Plan Estándar'}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-2.5">
              <span className="text-slate-500 font-medium">Margen Consumo Extra:</span>
              <Badge variant={consumption?.allow_extra ? 'purple' : 'neutral'} size="sm">
                {consumption?.allow_extra ? 'Habilitado (Hard Cap 100%)' : 'Bloqueado'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
          <Database size={16} className="text-indigo-600 shrink-0" />
          <span className="text-[11px] text-slate-500 leading-relaxed">
            Instancia aislada por esquema en PostgreSQL con cuota de recursos y gobernanza de datos independiente.
          </span>
        </div>
      </div>
    </div>
  );
};
