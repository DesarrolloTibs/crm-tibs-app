import React, { useEffect, useState } from 'react';
import { getOpportunityLabels, updateOpportunityLabel } from '../../services/opportunityLabelsService';
import type { OpportunityLabel } from '../../core/models/OpportunityLabel';
import Loader from '../Loader/Loader';
import { Sliders, Check, ArrowRight, ArrowLeft, Info, HelpCircle, MousePointer, Edit2 } from 'lucide-react';
import Notification from '../Modal/Notification';

interface Props {
    onLabelsUpdated?: () => void;
}

const OpportunityLabelsSettings: React.FC<Props> = ({ onLabelsUpdated }) => {
    const [labels, setLabels] = useState<OpportunityLabel[]>([]);
    const [selectedLabel, setSelectedLabel] = useState<OpportunityLabel | null>(null);
    const [step, setStep] = useState<1 | 2>(1);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);

    const [notification, setNotification] = useState({
        show: false,
        type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
        title: '',
        message: '',
        onConfirm: () => {},
        onCancel: () => {},
    });

    const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));

    const fetchLabels = async () => {
        setLoading(true);
        try {
            const data = await getOpportunityLabels();
            setLabels(data);
        } catch (error) {
            setNotification({
                show: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar las etiquetas de oportunidad',
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabels();
    }, []);

    const handleSelectField = (label: OpportunityLabel) => {
        setSelectedLabel(label);
        setNewName(label.strname || '');
        setStep(2);
    };

    const handleFieldClick = (fieldKey: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento') => {
        const targetLabel = labels.find(l => l.field_key === fieldKey);
        if (targetLabel) {
            handleSelectField(targetLabel);
        }
    };

    const getFieldClassName = (fieldKey: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento') => {
        const isSelected = selectedLabel?.field_key === fieldKey;
        
        if (step === 2) {
            if (isSelected) {
                return 'border-indigo-500 bg-indigo-50 shadow-sm relative ring-2 ring-indigo-200 border-solid scale-[1.02]';
            } else {
                return 'border-indigo-200 border-dashed bg-white hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all duration-200 opacity-60';
            }
        } else {
            return 'border-indigo-300 border-dashed bg-indigo-50/10 hover:border-indigo-600 hover:bg-indigo-50/70 hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.01]';
        }
    };

    // Validar si el nombre está duplicado con otro campo (excluyendo el que se está editando)
    const isNameDuplicate = () => {
        if (!selectedLabel || !newName.trim()) return false;
        return labels.some(
            l => l.id !== selectedLabel.id && 
            l.strname?.trim().toLowerCase() === newName.trim().toLowerCase()
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLabel) return;
        
        const cleanName = newName.trim();
        if (!cleanName) {
            setNotification({
                show: true,
                type: 'error',
                title: 'Validación',
                message: 'El nombre de la etiqueta no puede estar vacío',
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
            return;
        }

        if (isNameDuplicate()) {
            setNotification({
                show: true,
                type: 'error',
                title: 'Duplicado Detectado',
                message: 'El nombre de la etiqueta ya está siendo utilizado por otro campo.',
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
            return;
        }

        setLoading(true);
        try {
            // Guardar etiqueta. El backend eliminará el registro original,
            // creará un nuevo registro con un nuevo ID, y nos lo retornará.
            await updateOpportunityLabel(selectedLabel.id, cleanName);
            
            setStep(1);
            setSelectedLabel(null);
            setNotification({
                show: true,
                type: 'success',
                title: '¡Éxito!',
                message: 'Etiqueta modificada y sincronizada correctamente en base de datos.',
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
            
            // Recargar etiquetas locales y propagar cambio
            await fetchLabels();
            if (onLabelsUpdated) {
                onLabelsUpdated();
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'No se pudo actualizar la etiqueta';
            setNotification({
                show: true,
                type: 'error',
                title: 'Error',
                message: Array.isArray(msg) ? msg.join(', ') : msg,
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
        } finally {
            setLoading(false);
        }
    };

    const getFieldDescription = (key: string | undefined) => {
        switch (key) {
            case 'linea_negocio':
                return 'Define el sector o línea de negocio de la oportunidad comercial.';
            case 'tipo_entrega':
                return 'Define el tipo o modalidad de entrega y etiqueta el monto de servicios.';
            case 'licenciamiento':
                return 'Define la plataforma tecnológica y etiqueta el monto de licenciamiento.';
            default:
                return 'Campo personalizable en los detalles de oportunidades.';
        }
    };

    const getFieldBadge = (key: string | undefined) => {
        switch (key) {
            case 'linea_negocio':
                return 'Clasificación';
            case 'tipo_entrega':
                return 'Servicios y Montos';
            case 'licenciamiento':
                return 'Licencias y Montos';
            default:
                return 'General';
        }
    };

    const getFieldDefaultName = (key: string | undefined) => {
        switch (key) {
            case 'linea_negocio':
                return 'Línea de Negocio';
            case 'tipo_entrega':
                return 'Tipo de Entrega';
            case 'licenciamiento':
                return 'Licenciamiento';
            default:
                return 'Campo';
        }
    };

    const renderFormMockup = () => {
        // Encontrar los nombres actuales para mostrar en los campos no seleccionados
        const currentLicenciamiento = labels.find(l => l.field_key === 'licenciamiento')?.strname || 'Licenciamiento';
        const currentServicios = labels.find(l => l.field_key === 'tipo_entrega')?.strname || 'Servicios';
        const currentLineaNegocio = labels.find(l => l.field_key === 'linea_negocio')?.strname || 'Línea de Negocio';
        const currentTipoEntrega = labels.find(l => l.field_key === 'tipo_entrega')?.strname || 'Tipo de Entrega';

        // Determinar qué se está editando en tiempo real
        const isLic = selectedLabel?.field_key === 'licenciamiento';
        const isDel = selectedLabel?.field_key === 'tipo_entrega';
        const isBus = selectedLabel?.field_key === 'linea_negocio';

        // Nombres en vivo (si se está editando, usar newName, si no, el valor actual)
        const liveLic = isLic ? (newName || 'Licenciamiento') : currentLicenciamiento;
        const liveSer = isDel ? (newName || 'Servicios') : currentServicios;
        const liveBus = isBus ? (newName || 'Línea de Negocio') : currentLineaNegocio;
        const liveDel = isDel ? (newName || 'Tipo de Entrega') : currentTipoEntrega;

        return (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 text-left text-xs sticky top-4">
                <div className="border-b border-slate-200 pb-2">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                        <Sliders size={10} /> Ubicación en el Formulario
                    </p>
                    {step === 1 ? (
                        <p className="text-slate-650 font-medium text-[11px] mt-1 bg-indigo-50/80 border border-indigo-100 p-2 rounded-lg flex items-start gap-1.5 leading-relaxed">
                            <MousePointer size={12} className="text-indigo-600 shrink-0 mt-0.5" />
                            <span><strong>Selección Visual:</strong> Haz clic directamente sobre un campo resaltado en el formulario para modificar su etiqueta.</span>
                        </p>
                    ) : (
                        <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                            Visualización en tiempo real del campo editado. Puedes hacer clic en otro para cambiar la selección.
                        </p>
                    )}
                </div>

                {/* Sección 1: Datos del Proyecto */}
                <div className="space-y-2 opacity-35 select-none pointer-events-none">
                    <p className="font-bold text-slate-700 border-b border-slate-150 pb-1 uppercase tracking-wider text-[9px]">Datos del Proyecto</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-[9px] text-slate-500 block">Nombre del Proyecto</span>
                            <div className="h-7 border border-slate-200 rounded bg-slate-100 mt-1"></div>
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-500 block">Fecha Estimada</span>
                            <div className="h-7 border border-slate-200 rounded bg-slate-100 mt-1"></div>
                        </div>
                    </div>
                </div>

                {/* Sección 2: Detalles Financieros */}
                <div className="space-y-3">
                    <p className="font-bold text-slate-700 border-b border-slate-150 pb-1 uppercase tracking-wider text-[9px]">Detalles Financieros</p>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Campo Monto Licenciamiento */}
                        <div 
                            onClick={() => handleFieldClick('licenciamiento')}
                            className={`p-2.5 rounded-xl border transition-all duration-300 relative ${getFieldClassName('licenciamiento')}`}
                        >
                            {step === 1 && (
                                <span className="absolute -top-2 right-2 bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-200 flex items-center gap-0.5">
                                    <MousePointer size={8} /> Clic
                                </span>
                            )}
                            {step === 2 && isLic && (
                                <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                                    <Edit2 size={8} /> Editando
                                </span>
                            )}
                            {step === 2 && !isLic && (
                                <span className="absolute -top-2 right-2 bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-slate-200 opacity-0 hover:opacity-100 transition-opacity">
                                    Cambiar
                                </span>
                            )}
                            <span className={`text-[9px] block font-bold ${isLic ? 'text-indigo-700' : 'text-slate-500'}`}>
                                Monto {liveLic}
                            </span>
                            <div className={`h-7 border rounded mt-1 bg-white flex items-center px-2 text-slate-400 text-[10px] ${isLic ? 'border-indigo-300 text-indigo-700 font-semibold' : 'border-slate-200'}`}>
                                $ 0.00
                            </div>
                        </div>

                        {/* Campo Monto Servicios */}
                        <div 
                            onClick={() => handleFieldClick('tipo_entrega')}
                            className={`p-2.5 rounded-xl border transition-all duration-300 relative ${getFieldClassName('tipo_entrega')}`}
                        >
                            {step === 1 && (
                                <span className="absolute -top-2 right-2 bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-200 flex items-center gap-0.5">
                                    <MousePointer size={8} /> Clic
                                </span>
                            )}
                            {step === 2 && isDel && (
                                <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                                    <Edit2 size={8} /> Editando
                                </span>
                            )}
                            {step === 2 && !isDel && (
                                <span className="absolute -top-2 right-2 bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-slate-200 opacity-0 hover:opacity-100 transition-opacity">
                                    Cambiar
                                </span>
                            )}
                            <span className={`text-[9px] block font-bold ${isDel ? 'text-indigo-700' : 'text-slate-500'}`}>
                                Monto {liveSer}
                            </span>
                            <div className={`h-7 border rounded mt-1 bg-white flex items-center px-2 text-slate-400 text-[10px] ${isDel ? 'border-indigo-300 text-indigo-700 font-semibold' : 'border-slate-200'}`}>
                                $ 0.00
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sección 3: Clasificación */}
                <div className="space-y-3">
                    <p className="font-bold text-slate-700 border-b border-slate-150 pb-1 uppercase tracking-wider text-[9px]">Clasificación</p>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Campo Etapa (unhighlighted) */}
                        <div className="p-2.5 border border-slate-150 bg-white rounded-xl opacity-35 select-none pointer-events-none">
                            <span className="text-[9px] text-slate-500 block font-bold">Etapa</span>
                            <div className="h-7 border border-slate-200 rounded mt-1 bg-white flex items-center px-2 text-slate-550 text-[10px]">
                                Nuevo
                            </div>
                        </div>

                        {/* Campo Línea de Negocio */}
                        <div 
                            onClick={() => handleFieldClick('linea_negocio')}
                            className={`p-2.5 rounded-xl border transition-all duration-300 relative ${getFieldClassName('linea_negocio')}`}
                        >
                            {step === 1 && (
                                <span className="absolute -top-2 right-2 bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-200 flex items-center gap-0.5">
                                    <MousePointer size={8} /> Clic
                                </span>
                            )}
                            {step === 2 && isBus && (
                                <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                                    <Edit2 size={8} /> Editando
                                </span>
                            )}
                            {step === 2 && !isBus && (
                                <span className="absolute -top-2 right-2 bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-slate-200 opacity-0 hover:opacity-100 transition-opacity">
                                    Cambiar
                                </span>
                            )}
                            <span className={`text-[9px] block font-bold ${isBus ? 'text-indigo-700' : 'text-slate-500'}`}>
                                {liveBus}
                            </span>
                            <div className={`h-7 border rounded mt-1 bg-white flex items-center justify-between px-2 text-[10px] ${isBus ? 'border-indigo-300 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-500'}`}>
                                <span>-- Seleccionar --</span>
                                <span className="text-[8px] text-slate-400">▼</span>
                            </div>
                        </div>

                        {/* Campo Tipo de Entrega */}
                        <div 
                            onClick={() => handleFieldClick('tipo_entrega')}
                            className={`p-2.5 rounded-xl border transition-all duration-300 relative ${getFieldClassName('tipo_entrega')}`}
                        >
                            {step === 1 && (
                                <span className="absolute -top-2 right-2 bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-200 flex items-center gap-0.5">
                                    <MousePointer size={8} /> Clic
                                </span>
                            )}
                            {step === 2 && isDel && (
                                <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                                    <Edit2 size={8} /> Editando
                                </span>
                            )}
                            {step === 2 && !isDel && (
                                <span className="absolute -top-2 right-2 bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-slate-200 opacity-0 hover:opacity-100 transition-opacity">
                                    Cambiar
                                </span>
                            )}
                            <span className={`text-[9px] block font-bold ${isDel ? 'text-indigo-700' : 'text-slate-500'}`}>
                                {liveDel}
                            </span>
                            <div className={`h-7 border rounded mt-1 bg-white flex items-center justify-between px-2 text-[10px] ${isDel ? 'border-indigo-300 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-500'}`}>
                                <span>-- Seleccionar --</span>
                                <span className="text-[8px] text-slate-400">▼</span>
                            </div>
                        </div>

                        {/* Campo Licenciamiento */}
                        <div 
                            onClick={() => handleFieldClick('licenciamiento')}
                            className={`p-2.5 rounded-xl border transition-all duration-300 relative ${getFieldClassName('licenciamiento')}`}
                        >
                            {step === 1 && (
                                <span className="absolute -top-2 right-2 bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-200 flex items-center gap-0.5">
                                    <MousePointer size={8} /> Clic
                                </span>
                            )}
                            {step === 2 && isLic && (
                                <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                                    <Edit2 size={8} /> Editando
                                </span>
                            )}
                            {step === 2 && !isLic && (
                                <span className="absolute -top-2 right-2 bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-slate-200 opacity-0 hover:opacity-100 transition-opacity">
                                    Cambiar
                                </span>
                            )}
                            <span className={`text-[9px] block font-bold ${isLic ? 'text-indigo-700' : 'text-slate-500'}`}>
                                {liveLic}
                            </span>
                            <div className={`h-7 border rounded mt-1 bg-white flex items-center justify-between px-2 text-[10px] ${isLic ? 'border-indigo-300 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-500'}`}>
                                <span>-- Seleccionar --</span>
                                <span className="text-[8px] text-slate-400">▼</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Notification {...notification} />
            
            {/* Header del Módulo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-150 pb-5 animate-fade-in text-left">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Sliders size={20} className="text-indigo-600 animate-pulse" />
                        Asistente de Etiquetas de Oportunidad
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Sigue los pasos del asistente para modificar de forma segura las etiquetas del formulario y su tracking histórico.
                    </p>
                </div>
            </div>

            {/* Indicador Visual de Pasos */}
            <div className="max-w-xl mx-auto mb-10 px-4 animate-fade-in">
                <div className="flex items-center justify-center gap-2 sm:gap-6">
                    {/* Paso 1 */}
                    <div className={`flex items-center gap-2 pb-2.5 border-b-2 transition-all duration-300 ${
                        step === 1 ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-gray-400 font-medium'
                    }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            step === 1 ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-green-500 text-white'
                        }`}>
                            {step > 1 ? <Check size={12} /> : '1'}
                        </div>
                        <span className="text-xs whitespace-nowrap">
                            Seleccionar Campo
                        </span>
                    </div>

                    <ArrowRight size={14} className="text-gray-300 shrink-0 mb-1" />

                    {/* Paso 2 */}
                    <div className={`flex items-center gap-2 pb-2.5 border-b-2 transition-all duration-300 ${
                        step === 2 ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-gray-400 font-medium'
                    }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            step === 2 ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-gray-200 text-gray-500'
                        }`}>
                            2
                        </div>
                        <span className="text-xs whitespace-nowrap">
                            Modificar Etiqueta
                        </span>
                    </div>
                </div>
            </div>

            {loading && labels.length === 0 ? (
                <div className="py-20"><Loader /></div>
            ) : (
                <div className="max-w-6xl mx-auto mt-12 text-left">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* COLUMNA IZQUIERDA: Formulario o selección */}
                        <div className="lg:col-span-7 space-y-6">
                            
                            {/* PASO 1: Selección del Campo */}
                            {step === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                                        <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                                        <div className="text-xs text-indigo-900 leading-relaxed">
                                            <strong>¿Cómo funciona el guardado?</strong> Al guardar la etiqueta del campo seleccionado, se sincronizará automáticamente para mapear los campos en los formularios y el historial de interacciones.
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Elige el campo que deseas renombrar:
                                    </h3>

                                    <div className="flex flex-col gap-4">
                                        {labels.map((label) => {
                                            const defaultFieldName = getFieldDefaultName(label.field_key);
                                            const badgeCategory = getFieldBadge(label.field_key);
                                            const description = getFieldDescription(label.field_key);

                                            return (
                                                <button
                                                    key={label.id}
                                                    type="button"
                                                    onClick={() => handleSelectField(label)}
                                                    className="flex justify-between items-center p-5 border border-slate-200 rounded-2xl bg-white hover:border-indigo-500 hover:shadow-lg transition-all duration-300 group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:scale-[1.01]"
                                                >
                                                    <div className="space-y-2 flex-grow pr-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                                                                {badgeCategory}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                Clave: {label.field_key}
                                                            </span>
                                                        </div>
                                                        
                                                        <h4 className="font-bold text-slate-800 text-base">
                                                            {defaultFieldName}
                                                        </h4>

                                                        <p className="text-xs text-slate-500 leading-relaxed">
                                                            {description}
                                                        </p>

                                                        <div className="pt-1 flex items-center gap-1.5 text-xs">
                                                            <span className="text-slate-400 font-medium">Etiqueta actual:</span>
                                                            <span className="font-bold text-slate-700">{label.strname}</span>
                                                        </div>
                                                    </div>

                                                    <span className="bg-indigo-600 text-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 shrink-0">
                                                        <ArrowRight size={14} />
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* PASO 2: Edición e Ingreso de Etiqueta */}
                            {step === 2 && selectedLabel && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setSelectedLabel(null);
                                        }}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                    >
                                        <ArrowLeft size={14} />
                                        Volver al Paso 1
                                    </button>

                                    <div className="border-b border-slate-100 pb-4">
                                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                            {getFieldBadge(selectedLabel.field_key)}
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-800 mt-1">
                                            Modificar etiqueta para: {getFieldDefaultName(selectedLabel.field_key)}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Estás editando el campo dinámico del sistema.
                                        </p>
                                    </div>

                                    <form onSubmit={handleSave} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                                                Nuevo Nombre de la Etiqueta
                                            </label>
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full border border-slate-350 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold text-slate-800"
                                                placeholder="Escribe el nombre aquí..."
                                                maxLength={100}
                                                required
                                                autoFocus
                                            />
                                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                                <HelpCircle size={12} />
                                                La etiqueta no puede estar vacía ni duplicada con las otras dos etiquetas del bloque.
                                            </p>
                                        </div>

                                        {/* Mensaje de Alerta en caso de Duplicidad */}
                                        {isNameDuplicate() && (
                                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2 animate-fade-in">
                                                <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
                                                <span className="text-xs text-red-800 font-semibold">
                                                    Error: Este nombre ya está asignado a otra etiqueta. Por favor, elige un nombre único para evitar confusión.
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStep(1);
                                                    setSelectedLabel(null);
                                                }}
                                                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading || !newName.trim() || isNameDuplicate()}
                                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5 hover:scale-[1.02]"
                                            >
                                                {loading && (
                                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                )}
                                                <span>Guardar y Reemplazar</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* COLUMNA DERECHA: Vista previa de ubicación */}
                        <div className="lg:col-span-5">
                            {renderFormMockup()}
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};

export default OpportunityLabelsSettings;
