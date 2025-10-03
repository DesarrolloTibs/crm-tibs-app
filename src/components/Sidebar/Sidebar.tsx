import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Users, Briefcase, BarChart3, LogOut, History } from 'lucide-react';

interface Props {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<Props> = ({ isSidebarOpen }) => {
    const { logout, isAdmin } = useAuth();

    const sidebarClasses = `
        fixed inset-y-0 left-0 z-40 w-64 bg-blue-800 text-white 
        flex flex-col transform transition-transform duration-300 ease-in-out 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `;

    return (
        <aside className={sidebarClasses}>
            <div className="p-6 font-bold text-2xl border-b border-blue-700 text-gradient">Friday</div>
            <nav className="flex-grow p-4">
                <ul className="space-y-2">
                    <li><NavLink to="/clients" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${isActive ? 'bg-blue-700' : 'hover:bg-blue-700/50'}`}><Briefcase size={20} /> Clientes</NavLink></li>
                    <li><NavLink to="/pipeline" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${isActive ? 'bg-blue-700' : 'hover:bg-blue-700/50'}`}><BarChart3 size={20} /> Pipeline</NavLink></li>
                    <li><NavLink to="/history" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${isActive ? 'bg-blue-700' : 'hover:bg-blue-700/50'}`}><History size={20} /> Historial</NavLink></li>
                    {isAdmin && <li><NavLink to="/users" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${isActive ? 'bg-blue-700' : 'hover:bg-blue-700/50'}`}><Users size={20} /> Usuarios</NavLink></li>}
                </ul>
            </nav>
            <div className="p-4 border-t border-blue-700">
                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-red-400 hover:bg-red-500 hover:text-white transition-colors"><LogOut size={20} /> Cerrar Sesión</button>
            </div>
        </aside>
    );
};

export default Sidebar;