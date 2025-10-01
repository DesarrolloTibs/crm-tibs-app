import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <aside className="w-64 h-screen bg-gray-800 text-white flex flex-col">
            <div className="p-6 font-bold text-xl border-b border-gray-700">CRM TIBS</div>
            <nav className="flex-1 p-4">
                <ul className="space-y-4">
                    <li>
                        <Link to="/clients" className="hover:text-blue-300">Clientes</Link>
                    </li>
                    {/* Agrega más enlaces aquí si tienes más páginas */}
                </ul>
            </nav>
            <button
                onClick={handleLogout}
                className="m-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
                Logout
            </button>
        </aside>
    );
};

export default Sidebar;