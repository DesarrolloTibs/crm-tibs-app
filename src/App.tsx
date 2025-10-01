import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ClientsPage from './pages/ClientsPage';
import PipelinePage from './pages/PipelinePage';
import ProtectedRoute from './core/guards/ProtectedRoute';
import UsersPage from './pages/UsersPage';

const App: React.FC = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
                <Route
                path="/users"
                element={
                    <ProtectedRoute>
                        <UsersPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/clients"
                element={
                    <ProtectedRoute>
                        <ClientsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/pipeline"
                element={
                    <ProtectedRoute>
                        <PipelinePage />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/pipeline" />} />
        </Routes>
    </BrowserRouter>
);

const CrmApp: React.FC = () => <App />;

export default CrmApp;
