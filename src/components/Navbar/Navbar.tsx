import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useConfigStore } from '../../store/useConfigStore';
import { Menu, X } from 'lucide-react';
import SeasonalContainer from './Season/SeasonalContainer';
import NotificationBell from './NotificationBell';
import TenantSelector from '../Settings/TenantSelector';
import ConsumptionInfoPopover from './ConsumptionInfoPopover';
import { getTenantConsumption } from '../../services/tenantsService';

interface Props {
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
}

const Navbar: React.FC<Props> = ({ toggleSidebar, isSidebarOpen }) => {
    const { user, isSuperAdmin } = useAuth();
    const { selectedTenant } = useConfigStore();
    const [tenantLogo, setTenantLogo] = useState<string | null>(null);

    // Notificaciones visibles para usuarios de tenant, y para SuperAdmin sólo cuando está en el esquema public (selectedTenant === null)
    const showNotificationBell = !isSuperAdmin || selectedTenant === null;

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const data = await getTenantConsumption(selectedTenant?.schema_name);
                if (data?.logo) {
                    const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3091';
                    setTenantLogo(data.logo.startsWith('http') ? data.logo : `${baseUrl}${data.logo}`);
                } else {
                    setTenantLogo(null);
                }
            } catch (err) {
                setTenantLogo(null);
            }
        };
        fetchLogo();
    }, [selectedTenant]);

    return (
        <header className="bg-white shadow-sm p-3 sm:p-4 flex justify-between items-center sticky top-0 z-20 border-b border-gray-100">
            <div className="flex items-center gap-3">
                {/* Botón para el menú */}
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    aria-label="Toggle menu"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Logo de la Empresa (Parte izquierda del Navbar) */}
                {tenantLogo && (
                    <div className="hidden sm:flex items-center h-10 px-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
                        <img 
                            src={tenantLogo} 
                            alt="Logo Empresa" 
                            className="max-h-8 max-w-[140px] object-contain" 
                        />
                    </div>
                )}
            </div>

            {/* Logo para móvil (centrado) */}
            <div className="sm:hidden flex-grow flex justify-center items-center">
                <span className="font-bold text-lg text-blue-800 tracking-tight text-center">Billy Sales & Services</span>
            </div>

            {/* Sección central para decoraciones temáticas (Desktop) */}
            <div className="flex-grow justify-center items-center hidden sm:flex h-16 relative overflow-visible mx-2">
                <div className="w-full h-full relative">
                    <SeasonalContainer />
                </div>
            </div>

            {/* Selector de Tenant Global para SuperAdmin, Popover de Consumo y Notificaciones */}
            <div className="flex items-center justify-end gap-2 sm:gap-4">
                {isSuperAdmin && <TenantSelector />}
                <ConsumptionInfoPopover />
                {showNotificationBell && <NotificationBell />}


                <div className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors p-1 sm:py-1.5 sm:px-3 rounded-full cursor-pointer border border-gray-200 shadow-sm w-9 h-9 sm:w-auto sm:h-auto select-none">
                    <span className="text-gray-600 hidden sm:flex items-center text-sm">
                        <span className="hidden sm:inline mr-1">Hola,</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[80px] sm:max-w-[150px]">{user?.username || 'Usuario'}</span>
                    </span>
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-inner shrink-0">
                        {(user?.username || 'U').substring(0, 1).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;

