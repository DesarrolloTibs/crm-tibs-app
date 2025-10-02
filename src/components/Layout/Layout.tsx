import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';

interface Props {
    children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
    // Hook para manejar el estado del sidebar y su comportamiento en diferentes tamaños de pantalla
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        // Limpieza del event listener al desmontar el componente
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Overlay para pantallas pequeñas */}
            {isSidebarOpen && (
                <div 
                    onClick={toggleSidebar} 
                    className="fixed inset-0 z-30 bg-black opacity-50"
                ></div>
            )}

            {/* Contenedor del Contenido Principal */}
            <div className="relative flex flex-col flex-1">
                {/* Navbar */}
                <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

                {/* Contenido de la página */}
                <main className=" mx-4 flex-grow overflow-y-auto">
                    {/* Ajustamos el padding del contenedor del children */}
                    <div className="p-4 md:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
