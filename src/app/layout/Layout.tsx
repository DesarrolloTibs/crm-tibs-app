import React, { useState, Suspense } from 'react';
import Sidebar from './sidebar/Sidebar';
import Navbar from './navbar/Navbar';
import { WebChat } from '@features/conversations';
import { useConfigStore } from '@/store/useConfigStore';
import { Loader } from '@shared/components';

interface Props {
    children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
    const { selectedTenant } = useConfigStore();
    // El sidebar siempre inicia cerrado
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="min-h-screen font-sans">
            <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {isSidebarOpen && (
                <div 
                    onClick={toggleSidebar} 
                    className="fixed inset-0 z-30 bg-slate-900/40 transition-opacity duration-300"
                ></div>
            )}

            {/* Contenedor del Contenido Principal */}
            <div className="relative flex flex-col flex-1 min-h-screen ">
                {/* Navbar */}
                <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

                {/* Contenido de la página */}
                <main className=" mx-4 flex-grow overflow-y-auto">
                    {/* Ajustamos el padding del contenedor del children y remontamos automáticamente al cambiar de tenant */}
                    <div key={selectedTenant?.schema_name || 'public'} className="p-4 md:p-6">
                        <Suspense fallback={<Loader className="h-64" size="lg" />}>
                            {children}
                        </Suspense>
                    </div>
                </main>
            </div>


            {/* WebChat Floating Widget — visible en todas las páginas */}
            <WebChat />
        </div>
    );
};

export default Layout;
