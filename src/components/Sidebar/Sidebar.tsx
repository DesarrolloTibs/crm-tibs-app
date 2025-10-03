import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Users, Briefcase, BarChart3, LogOut, History } from 'lucide-react';

interface Props {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<Props> = ({ isSidebarOpen, toggleSidebar }) => {
    const { logout, isAdmin } = useAuth();

    const sidebarClasses = `
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white 
        flex flex-col transform transition-transform duration-300 ease-in-out 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `;

    return (
        <aside className={sidebarClasses}>
            <div className="p-6 font-bold text-xl border-b border-gray-700">CRM TIBS</div>
            <nav className="flex-grow p-4">
                <ul className="space-y-2">
                    <li><NavLink to="/clients" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}><Briefcase size={20} /> Clientes</NavLink></li>
                    <li><NavLink to="/pipeline" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}><BarChart3 size={20} /> Pipeline</NavLink></li>
                    <li><NavLink to="/history" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}><History size={20} /> Historial</NavLink></li>
                    {isAdmin && <li><NavLink to="/users" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-md ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}><Users size={20} /> Usuarios</NavLink></li>}
                </ul>
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-red-400 hover:bg-red-500 hover:text-white"><LogOut size={20} /> Cerrar Sesión</button>
            </div>
        </aside>
    );
};

export default Sidebar;