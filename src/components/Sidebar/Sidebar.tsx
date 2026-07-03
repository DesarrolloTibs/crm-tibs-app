import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Users, Briefcase, BarChart3, LogOut, ClipboardList, DollarSign, Settings, Package, LifeBuoy, LayoutDashboard, MessageSquare } from 'lucide-react';

interface Props {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<Props> = ({ isSidebarOpen, toggleSidebar }) => {
    const { logout, isAdmin } = useAuth();

    const sidebarClasses = `
        fixed inset-y-0 left-0 z-40 w-66 bg-white text-slate-800 shadow-2xl border-r border-slate-200/80
        flex flex-col transform transition-transform duration-300 ease-in-out 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `;

    const handleLogout = () => {
        if (isSidebarOpen) {
            toggleSidebar();
        }
        logout();
    };

    const getLinkClass = (isActive: boolean) => {
        const base = "flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-extrabold uppercase tracking-wider border-l-4 select-none cursor-pointer";
        if (isActive) {
            return `${base} bg-blue-50/70 text-blue-600 border-blue-600 shadow-sm shadow-blue-500/5`;
        }
        return `${base} text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 border-transparent`;
    };

    return (
        <aside className={sidebarClasses}>
            <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-slate-50/20 select-none">
                <span className="font-extrabold text-base text-slate-800 tracking-tight">
                    Billy <span className="text-blue-600 font-black">Sales & Services</span>
                </span>
            </div>
            <nav className="flex-grow p-4 overflow-y-auto">
                <ul className="space-y-2">
                    <li><NavLink to="/dashboard" onClick={toggleSidebar} className={({ isActive }) => getLinkClass(isActive)}><LayoutDashboard size={18} /> Dashboard</NavLink></li>
                    <li><NavLink to="/clients" onClick={toggleSidebar} className={({ isActive }) => getLinkClass(isActive)}><Briefcase size={18} /> Clientes</NavLink></li>
                    <li><NavLink to="/pipeline" onClick={toggleSidebar} className={({ isActive }) => getLinkClass(isActive)}><BarChart3 size={18} /> Pipeline</NavLink></li>
                    <li><NavLink to="/activities" onClick={toggleSidebar} className={({ isActive }) => getLinkClass(isActive)}><ClipboardList size={18} /> Actividades</NavLink></li>
                    <li><NavLink to="/products" onClick={toggleSidebar} className={({ isActive }) => getLinkClass(isActive)}><Package size={18} /> Productos</NavLink></li>
                    <li><NavLink to="/helpdesk" onClick={toggleSidebar} className={({ isActive }) => getLinkClass(isActive)}><LifeBuoy size={18} /> Mesa de Ayuda</NavLink></li>
                    <li><NavLink to="/conversations" onClick={toggleSidebar} className={({ isActive }) => getLinkClass(isActive)}><MessageSquare size={18} /> Conversaciones</NavLink></li>
                    <li><NavLink to="/expenses" onClick={toggleSidebar} className={({ isActive }) => getLinkClass(isActive)}><DollarSign size={18} /> Gastos</NavLink></li>
                    {isAdmin && <li><NavLink to="/users" onClick={toggleSidebar} className={({ isActive }) => getLinkClass(isActive)}><Users size={18} /> Usuarios</NavLink></li>}
                    {isAdmin && <li><NavLink to="/settings" onClick={toggleSidebar} className={({ isActive }) => getLinkClass(isActive)}><Settings size={18} /> Configuración</NavLink></li>}
                </ul>
            </nav>
            <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-all duration-200 text-sm font-extrabold uppercase tracking-widest border border-transparent hover:border-red-100 cursor-pointer"
                >
                    <LogOut size={18} /> Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;