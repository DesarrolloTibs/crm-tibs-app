import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { XCircle, ClipboardList, Settings } from 'lucide-react';
import ActivityTypesSettings from '../components/ActivityType/ActivityTypesSettings';

type SettingTab = 'activity-types';

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
        // En el futuro, se pueden añadir más secciones aquí:
        // {
        //     title: 'Clientes',
        //     options: [
        //         { id: 'client-categories', label: 'Categorías de Cliente', icon: <Users size={16} /> }
        //     ]
        // }
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
                {/* Menú lateral de configuración */}
                <aside className="w-full lg:w-64 bg-gray-50/50 border-r border-gray-100 p-4 flex flex-col gap-6">
                    {sections.map((section, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5">
                            <span className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 select-none">
                                {section.title}
                            </span>
                            <ul className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                                {section.options.map(option => {
                                    const isActive = activeTab === option.id;
                                    return (
                                        <li key={option.id} className="w-full">
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
                <main className="flex-grow p-6 lg:p-8 bg-white">
                    {renderActiveContent()}
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;
