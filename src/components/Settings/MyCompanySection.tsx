import React, { useState, useEffect } from 'react';
import { 
  Building2, Upload, CheckCircle2, Zap, ShieldCheck, ShieldPlus,
  Calendar, DollarSign, Layers, Cpu, Image as ImageIcon, Sparkles,
  Lightbulb, Info
} from 'lucide-react';
import Notification from '../Modal/Notification';
import Loader from '../Loader/Loader';
import Button from '../shared/Button';
import SettingsContainer from '../shared/SettingsContainer';
import { useConfigStore } from '../../store/useConfigStore';
import { 
  getTenantConsumption, 
  updateAllowExtra, 
  uploadTenantLogo, 
  type TenantConsumptionData 
} from '../../services/tenantsService';

const MyCompanySection: React.FC = () => {
  const { selectedTenant, setSelectedTenant } = useConfigStore();
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [updatingAllowExtra, setUpdatingAllowExtra] = useState(false);
  
  const [consumption, setConsumption] = useState<TenantConsumptionData | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Notification State estándar
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3091';

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTenantConsumption(selectedTenant?.schema_name);
      setConsumption(data);
      if (data.logo) {
        setLogoPreview(data.logo.startsWith('http') ? data.logo : `${baseUrl}${data.logo}`);
      } else {
        setLogoPreview(null);
      }
    } catch (err) {
      console.error('Error al cargar información de Mi Empresa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTenant]);

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
      setNotification({
        show: true,
        type: 'error',
        title: 'Error de Identificación',
        message: 'No se identificó la organización actual para actualizar el logo.',
        onConfirm: hideNotification,
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

      if (selectedTenant && selectedTenant.id === targetTenantId) {
        setSelectedTenant({
          ...selectedTenant,
          logo: updatedTenant.logo,
        });
      }

      setNotification({
        show: true,
        type: 'success',
        title: 'Logo Actualizado',
        message: 'El logo de la empresa se ha actualizado correctamente.',
        onConfirm: hideNotification,
      });
      fetchData();
    } catch (err) {
      console.error('Error al subir el logo:', err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error de Carga',
        message: 'Ocurrió un fallo al guardar la imagen de la empresa.',
        onConfirm: hideNotification,
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleToggleAllowExtra = async () => {
    const targetTenantId = consumption?.tenant_id || selectedTenant?.id;
    if (!targetTenantId) return;

    const newValue = !consumption?.allow_extra;
    setUpdatingAllowExtra(true);

    try {
      await updateAllowExtra(targetTenantId, newValue);
      setConsumption((prev: TenantConsumptionData | null) => prev ? { ...prev, allow_extra: newValue } : null);

      setNotification({
        show: true,
        type: 'success',
        title: newValue ? 'Consumo Extra Habilitado' : 'Consumo Extra Deshabilitado',
        message: newValue 
          ? 'Los usuarios podrán continuar consultando la IA usando consumo extra al agotarse el plan base.'
          : 'Las consultas a la IA se restringirán cuando se alcance el límite de tokens del plan base.',
        onConfirm: hideNotification,
      });
    } catch (err) {
      console.error('Error al cambiar configuración de consumo extra:', err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Error de Configuración',
        message: 'No se pudo actualizar el estado del consumo extra.',
        onConfirm: hideNotification,
      });
    } finally {
      setUpdatingAllowExtra(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  const tokensUsed = consumption?.tokens_used ?? 0;
  const tokensExtraUsed = consumption?.tokens_extra_used ?? 0;
  const tokensLimit = consumption?.tokens_limit ?? 300000;
  const planExhausted = tokensUsed >= tokensLimit;
  const tokensPercent = Math.min(Math.round((tokensUsed / (tokensLimit || 1)) * 100), 100);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <SettingsContainer
      title={consumption?.tenant_name || selectedTenant?.name || 'Mi Empresa'}
      description="Consulte el estado general de su organización, administre el logo oficial para la barra de navegación superior, examine la suscripción contratada y configure las reglas de consumo extra de Inteligencia Artificial."
      icon={<Building2 size={20} />}
      rightAction={
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${
            consumption?.is_active 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${consumption?.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{consumption?.is_active ? 'Empresa Habilitada' : 'Instancia Inactiva'}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
            <ShieldCheck size={14} />
            <span>{consumption?.plan_name || 'Plan Activo'}</span>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Columna Izquierda: Logo e Información General */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card: Logo Oficial */}
          <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <ImageIcon className="text-blue-600" size={20} />
              <h4 className="font-bold text-gray-800 text-base">Logo Oficial de la Empresa</h4>
            </div>

            {/* Preview del Logo */}
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-all">
              {logoPreview ? (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-40 h-20 flex items-center justify-center p-2 bg-white rounded-lg shadow-sm border border-gray-200">
                    <img 
                      src={logoPreview} 
                      alt="Logo de la empresa" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 size={12} /> Logo Activo
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-2 py-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building2 size={24} />
                  </div>
                  <p className="text-xs font-bold text-gray-700">Sin logo asignado</p>
                  <p className="text-[11px] text-gray-400">Archivos recomendados: PNG, JPG o SVG</p>
                </div>
              )}
            </div>

            {/* Controles de Carga */}
            <div className="space-y-3 pt-1">
              <input
                type="file"
                id="logo-upload-input"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex gap-2">
                <label
                  htmlFor="logo-upload-input"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  <Upload size={14} />
                  <span>{logoFile ? 'Cambiar Imagen' : 'Seleccionar Logo'}</span>
                </label>

                {logoFile && (
                  <Button
                    variant="indigo"
                    onClick={handleUploadLogo}
                    loading={uploadingLogo}
                    className="!py-2 !px-4"
                  >
                    Guardar
                  </Button>
                )}
              </div>

              {logoFile && (
                <p className="text-[11px] text-blue-600 font-medium truncate">
                  Archivo listo: {logoFile.name}
                </p>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Lightbulb size={14} className="text-amber-500 shrink-0" />
                <span>Este logo se proyectará en la barra superior del sistema.</span>
              </div>
            </div>
          </div>

          {/* Card: Información de la Instancia */}
          <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Building2 className="text-indigo-600" size={20} />
              <h4 className="font-bold text-gray-800 text-base">Información de la Instancia</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Nombre de Organización:</span>
                <span className="font-bold text-gray-800">{consumption?.tenant_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-500 font-medium">Estado Instancia:</span>
                <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-[10px] ${
                  consumption?.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {consumption?.is_active ? 'HABILITADA' : 'INACTIVA'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Suscripción, Consumo & Consumo Extra */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card: Detalles de la Suscripción */}
          <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="text-blue-600" size={20} />
                <h4 className="font-bold text-gray-800 text-base">Detalles del Plan & Suscripción</h4>
              </div>
              <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-150 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {consumption?.plan_name || 'Plan Pro'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
                  <ShieldCheck size={14} className="text-indigo-500" />
                  <span>Plan Asignado</span>
                </div>
                <p className="text-sm font-extrabold text-gray-800">
                  {consumption?.plan_name || 'Plan Estándar'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
                  <DollarSign size={14} className="text-emerald-500" />
                  <span>Costo Período</span>
                </div>
                <p className="text-sm font-extrabold text-gray-800">
                  ${consumption?.price ? consumption.price.toLocaleString() : '0'} MXN
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
                  <Calendar size={14} className="text-amber-500" />
                  <span>Próxima Renovación</span>
                </div>
                <p className="text-xs font-extrabold text-gray-800">
                  {formatDate(consumption?.next_renewal_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Card: Uso de Recursos de IA & Consumo Extra */}
          <div className="bg-white rounded-xl border border-gray-150 p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="text-amber-500" size={20} />
                <h4 className="font-bold text-gray-800 text-base">Uso de Recursos de Inteligencia Artificial</h4>
              </div>
            </div>

            {/* Consumo de Tokens Base */}
            <div className="space-y-2.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Tokens del Plan Base
                  </span>
                </div>
                <span className="text-xs font-bold font-mono text-gray-800">
                  {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()} tokens
                </span>
              </div>

              {/* Progress Bar Base */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    planExhausted ? 'bg-rose-500' : tokensPercent > 80 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${tokensPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-medium text-gray-500 pt-0.5">
                <span>{tokensPercent}% del límite base utilizado</span>
                <span>
                  {planExhausted 
                    ? '0 tokens base disponibles' 
                    : `${(tokensLimit - tokensUsed).toLocaleString()} tokens restantes`}
                </span>
              </div>
            </div>

            {/* SECCIÓN DE CONSUMO EXTRA (Solo si el plan base fue consumido en su totalidad) */}
            {planExhausted ? (
              <div className="space-y-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber-600" />
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                      Consumo Extra de IA (Recursos Adicionales Consumidos)
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                    Límite Base Agotado
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-amber-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-800">Tokens Procesados por Consumo Extra:</p>
                    <p className="text-xl font-black text-amber-600 font-mono">
                      +{tokensExtraUsed.toLocaleString()} <span className="text-xs font-normal text-gray-500">tokens</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-gray-500">Estado Consumo Extra:</p>
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                      consumption?.allow_extra ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {consumption?.allow_extra ? 'PERMITIDO' : 'BLOQUEADO'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-[11px] text-amber-700 leading-normal">
                  <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>Los recursos del plan base fueron superados. Las solicitudes adicionales procesadas corresponden a consumo extra autorizado.</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-2.5">
                <Zap size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 leading-relaxed">
                  <span className="font-bold">Estatus del Consumo Extra:</span> Actualmente su organización dispone de tokens en el plan base ({ (tokensLimit - tokensUsed).toLocaleString() } tokens disponibles). El consumo extra únicamente tomará vigencia si los recursos del plan base son consumidos totalmente.
                </div>
              </div>
            )}

            {/* Tarjeta: Consumo adicional (Diseño exacto al prototipo) */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-150 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 border border-indigo-100/60 flex items-center justify-center shrink-0 text-indigo-600">
                  <ShieldPlus size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">Consumo adicional</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-lg">
                    Permite procesar documentos excediendo el límite de tu plan actual. El costo se verá reflejado en tu facturación mensual como cargos adicionales.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/80 border border-slate-100 rounded-2xl shrink-0 self-start sm:self-center">
                <span className={`text-[11px] font-black tracking-wider ${
                  consumption?.allow_extra ? 'text-indigo-600' : 'text-slate-400'
                }`}>
                  {consumption?.allow_extra ? 'HABILITADO' : 'DESHABILITADO'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleAllowExtra}
                  disabled={updatingAllowExtra}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    consumption?.allow_extra ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      consumption?.allow_extra ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={notification.onConfirm || hideNotification}
        onCancel={notification.onCancel || hideNotification}
      />
    </SettingsContainer>
  );
};

export default MyCompanySection;
