import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ClientsPage from './pages/ClientsPage';
import PipelinePage from './pages/PipelinePage';
import OpportunitiesHistoryPage from './pages/OpportunitiesHistoryPage';
import UsersPage from './pages/UsersPage';
import ProtectedRoute from './core/guards/ProtectedRoute';
import Layout from './components/Layout/Layout'; // Importar el Layout

const App: React.FC = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/clients"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <ClientsPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/pipeline"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <PipelinePage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/history"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <OpportunitiesHistoryPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/users"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <Layout>
                            <UsersPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/clients" />} />
        </Routes>
    </BrowserRouter>
);

const CrmApp: React.FC = () => <App />;

export default CrmApp;
