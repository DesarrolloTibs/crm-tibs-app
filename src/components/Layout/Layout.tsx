import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';

interface Props {
    children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
    // Inicia abierto en pantallas grandes, cerrado en pequeñas
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen bg-gray-200 font-sans">
            <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            {/* El contenido principal se desplaza a la derecha cuando el sidebar está abierto en pantallas grandes */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                {/* Navbar */}
                <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

                {/* Contenido de la página */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className=" mx-4 px-2 py-4">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
