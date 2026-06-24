import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ClientsPage from './pages/ClientsPage';
import PipelinePage from './pages/PipelinePage';
import OpportunitiesHistoryPage from './pages/OpportunitiesHistoryPage';
import UsersPage from './pages/UsersPage';
import ProtectedRoute from './core/guards/ProtectedRoute';
import Layout from './components/Layout/Layout'; // Importar el Layout
import '../src/components/Sidebar/animations.css' // Importar los estilos globales
import ActivitiesPage from './pages/ActivitiesPage';
import ExpensesPage from './pages/ExpensesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CompaniesPage from './pages/CompaniesPage';
import SettingsPage from './pages/SettingsPage';
import ProductsPage from './pages/ProductsPage';
import HelpdeskPage from './pages/HelpdeskPage';

const App: React.FC = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
                path="/companies"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <CompaniesPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
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
                path="/products"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <ProductsPage />
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
                path="/helpdesk"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <HelpdeskPage />
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
                path="/activities"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <ActivitiesPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/expenses"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <ExpensesPage />
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
            <Route
                path="/settings"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <Layout>
                            <SettingsPage />
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
