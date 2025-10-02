import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Menu, X } from 'lucide-react';

interface Props {
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
}

const Navbar: React.FC<Props> = ({ toggleSidebar, isSidebarOpen }) => {
    const { user } = useAuth();

    return (
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                {/* Botón para el menú */}
                <button onClick={toggleSidebar} className="text-gray-600 hover:text-gray-800">
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                {/* Título o breadcrumbs */}
                <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">Dashboard</h1>
            </div>

            {/* Información del usuario */}
            <div className="flex items-center gap-4">
                <span className="text-gray-600">Hola, <span className="font-semibold">{user?.username || 'Usuario'}</span></span>
                {/* Aquí se podría añadir un menú desplegable para el perfil y logout */}
            </div>
        </header>
    );
};

export default Navbar;
