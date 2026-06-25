import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Menu, X } from 'lucide-react';
import SeasonalContainer from './Season/SeasonalContainer';

interface Props {
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
}

const Navbar: React.FC<Props> = ({ toggleSidebar, isSidebarOpen }) => {
    const { user } = useAuth();

    return (
        <header className="bg-white shadow-sm p-3 sm:p-4 flex justify-between items-center sticky top-0 z-20 border-b border-gray-100">
            <div className="flex items-center gap-4 w-1/4">
                {/* Botón para el menú */}
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Toggle menu"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Logo para móvil (centrado) */}
            <div className="sm:hidden flex-grow flex justify-center items-center">
                <span className="font-bold text-lg text-blue-800 tracking-tight text-center">Billy Sales & Services</span>
            </div>

            {/* Sección central para decoraciones temáticas (Desktop) */}
            <div className="flex-grow justify-center items-center hidden sm:flex h-16 relative overflow-visible mx-2 w-1/2">
                <div className="w-full h-full relative">
                    <SeasonalContainer />
                </div>
            </div>

            {/* Información del usuario */}
            <div className="flex items-center justify-end gap-2 sm:gap-4 w-1/4">
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
