import React, { useEffect, useState, useMemo } from 'react';
import Select from '../components/shared/Select';
import { useAuth } from '../hooks/useAuth';
import { XCircle, ClipboardList, Settings, Sliders, Database, Bell } from 'lucide-react';
import ActivityTypesSettings from '../components/ActivityType/ActivityTypesSettings';
import OpportunityLabelsSettings from '../components/OpportunityLabel/OpportunityLabelsSettings';
import OpportunityCatalogSettings from '../components/OpportunityLabel/OpportunityCatalogSettings';
import HelpdeskCronSettings from '../components/Helpdesk/HelpdeskCronSettings';
import { getOpportunityLabels } from '../services/opportunityLabelsService';
import type { OpportunityLabel } from '../core/models/OpportunityLabel';

type SettingTab = 'activity-types' | 'opportunity-labels' | 'opportunity-catalogs' | 'helpdesk-cron';

interface SettingOption {
    id: SettingTab;
    label: string;
    icon: React.ReactNode;
}

interface SettingSection {
    title: string;
    options: SettingOption[];
}

const SettingsPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingTab>('activity-types');
    const [activeCatalogSubTab, setActiveCatalogSubTab] = useState<'business-lines' | 'delivery-types' | 'licensings'>('business-lines');
    const [labels, setLabels] = useState<OpportunityLabel[]>([]);

    const mobileOptions = useMemo(() => [
        { value: 'activity-types', label: 'Tipos de Actividad' },
        { value: 'opportunity-labels', label: 'Etiquetas de Catálogos' },
        { value: 'opportunity-catalogs', label: 'Valores de Catálogos' },
        { value: 'helpdesk-cron', label: 'Notificaciones automáticas' },
    ], []);

    const fetchLabels = async () => {
        try {
            const data = await getOpportunityLabels();
            setLabels(data);
        } catch (err) {
            console.error('Error al cargar etiquetas en Configuración:', err);
        }
    };

    useEffect(() => {
        fetchLabels();
    }, [activeTab]);

    const getLabelNameByKey = (key: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento', defaultName: string) => {
        const label = labels.find(l => l.field_key === key);
        return label && label.strname ? label.strname : defaultName;
    };

    // Estructura de secciones de configuración escalable para el futuro
    const sections: SettingSection[] = [
        {
            title: 'Actividades',
            options: [
                {
                    id: 'activity-types',
                    label: 'Tipos de Actividad',
                    icon: <ClipboardList size={16} />,
                },
            ],
        },
        {
            title: 'Oportunidades',
            options: [
                {
                    id: 'opportunity-labels',
                    label: 'Etiquetas de Catálogos',
                    icon: <Sliders size={16} />,
                },
                {
                    id: 'opportunity-catalogs',
                    label: 'Valores de Catálogos',
                    icon: <Database size={16} />,
                },
            ],
        },
        {
            title: 'Mesa de ayuda',
            options: [
                {
                    id: 'helpdesk-cron',
                    label: 'Notificaciones automáticas',
                    icon: <Bell size={16} />,
                },
            ],
        },
    ];

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
                <XCircle size={64} className="mb-4 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
                <p className="mt-2 text-sm text-gray-600">No tienes permisos de administrador para ver la configuración del sistema.</p>
            </div>
        );
    }

    const renderActiveContent = () => {
        switch (activeTab) {
            case 'activity-types':
                return <ActivityTypesSettings />;
            case 'opportunity-labels':
                return <OpportunityLabelsSettings onLabelsUpdated={fetchLabels} />;
            case 'helpdesk-cron':
                return <HelpdeskCronSettings />;
            case 'opportunity-catalogs':
                return (
                    <div className="flex flex-col gap-6 text-left">
                        {/* Sub-pestañas internas */}
                        <div className="border-b border-gray-150">
                            <nav className="flex -mb-px space-x-6 overflow-x-auto no-scrollbar">
                                {(
                                    [
                                        { id: 'business-lines', label: getLabelNameByKey('linea_negocio', 'Línea de Negocio') },
                                        { id: 'delivery-types', label: getLabelNameByKey('tipo_entrega', 'Tipo de Entrega') },
                                        { id: 'licensings', label: getLabelNameByKey('licenciamiento', 'Licenciamiento') },
                                    ] as const
                                ).map((tab) => {
                                    const isActive = activeCatalogSubTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveCatalogSubTab(tab.id)}
                                            className={`pb-4 px-1 border-b-2 font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                                                isActive
                                                    ? 'border-indigo-600 text-indigo-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                        
                        {/* Contenido del Catálogo Seleccionado */}
                        <div className="animate-fade-in" key={activeCatalogSubTab}>
                            {activeCatalogSubTab === 'business-lines' && (
                                <OpportunityCatalogSettings
                                    catalogType="business-lines"
                                    catalogTitle={getLabelNameByKey('linea_negocio', 'Línea de Negocio')}
                                />
                            )}
                            {activeCatalogSubTab === 'delivery-types' && (
                                <OpportunityCatalogSettings
                                    catalogType="delivery-types"
                                    catalogTitle={getLabelNameByKey('tipo_entrega', 'Tipo de Entrega')}
                                />
                            )}
                            {activeCatalogSubTab === 'licensings' && (
                                <OpportunityCatalogSettings
                                    catalogType="licensings"
                                    catalogTitle={getLabelNameByKey('licenciamiento', 'Licenciamiento')}
                                />
                            )}
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="p-6 text-center text-gray-500">
                        Selecciona una opción de configuración.
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Settings size={28} className="text-blue-800" />
                <h1 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h1>
            </div>

            <div className="flex flex-col lg:flex-row bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
                {/* Selector para móvil (oculto en pantallas grandes) */}
                <div className="lg:hidden p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-2">
                    <label htmlFor="settings-tab-select" className="text-xs font-bold uppercase tracking-wider text-gray-400 select-none text-left">
                        Categoría de Configuración
                    </label>
                    <Select
                        inputId="settings-tab-select"
                        value={mobileOptions.find(opt => opt.value === activeTab)}
                        onChange={(selected) => {
                            if (selected) setActiveTab(selected.value as SettingTab);
                        }}
                        options={mobileOptions}
                        isSearchable={false}
                    />
                </div>

                {/* Menú lateral de configuración (escritorio) */}
                <aside className="hidden lg:flex w-full lg:w-64 bg-gray-50/50 border-b lg:border-b-0 lg:border-r border-gray-100 p-4 flex-col gap-4 lg:gap-6 shrink-0">
                    {sections.map((section, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5">
                            <span className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 select-none">
                                {section.title}
                            </span>
                            <ul className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible no-scrollbar">
                                {section.options.map(option => {
                                    const isActive = activeTab === option.id;
                                    return (
                                        <li key={option.id} className="w-auto lg:w-full shrink-0">
                                            <button
                                                onClick={() => setActiveTab(option.id)}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left whitespace-nowrap lg:whitespace-normal ${
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-700 shadow-sm border-l-2 border-blue-600 pl-2.5'
                                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-2 border-transparent'
                                                }`}
                                            >
                                                {option.icon}
                                                <span>{option.label}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </aside>

                {/* Panel de contenido derecho */}
                <main className="flex-grow p-4 sm:p-6 lg:p-8 bg-white overflow-hidden">
                    {renderActiveContent()}
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;
