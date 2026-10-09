import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@core/guards/ProtectedRoute';
import { Layout } from '@app/layout';
import '@app/layout/sidebar/animations.css';
import { PwaUpdateNotification, Loader } from '@shared/components';

// Rutas Públicas / Auth (Lazy Loading)
const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@features/auth/pages/ResetPasswordPage'));
const SupportTicketPage = lazy(() => import('@features/helpdesk/pages/SupportTicketPage'));
const OAuthCallbackPopup = lazy(() =>
    import('@features/settings/AiAgentChannels/components/OAuthCallbackPopup').then((m) => ({
        default: m.OAuthCallbackPopup,
    }))
);

// Rutas Protegidas de Negocio (Lazy Loading)
const DashboardPage = lazy(() => import('@features/dashboard/pages/DashboardPage'));
const ClientsPage = lazy(() => import('@features/crm/ClientsPage'));
const ProductsPage = lazy(() => import('@features/products/pages/ProductsPage'));
const PipelinePage = lazy(() => import('@features/pipeline/pages/PipelinePage'));
const HelpdeskPage = lazy(() => import('@features/helpdesk/pages/HelpdeskPage'));
const ConversationsPage = lazy(() => import('@features/conversations/pages/ConversationsPage'));
const ActivitiesPage = lazy(() => import('@features/activities/ActivitiesPage'));
const ExpensesPage = lazy(() => import('@features/expenses/pages/ExpensesPage'));
const UsersPage = lazy(() => import('@features/users/pages/UsersPage'));
const SettingsPage = lazy(() => import('@features/settings/SettingsPage'));

const RouteFallback: React.FC = () => (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Loader size="lg" />
    </div>
);

const isOAuthPopup = typeof window !== 'undefined' && (
    window.location.search.includes('meta_oauth') ||
    window.location.search.includes('oauth=') ||
    window.name === 'meta-oauth-popup' ||
    window.location.pathname === '/oauth/callback'
);

const App: React.FC = () => {
    if (isOAuthPopup) {
        return (
            <Suspense fallback={<RouteFallback />}>
                <OAuthCallbackPopup />
            </Suspense>
        );
    }

    return (
        <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
                <Routes>
                <Route path="/oauth/callback" element={<OAuthCallbackPopup />} />
                <Route path="/login" element={<LoginPage />} />
            <Route path="/support" element={<SupportTicketPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <DashboardPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/companies"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <ClientsPage defaultTab="companies" />
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
                path="/conversations"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <ConversationsPage />
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
                    <ProtectedRoute>
                        <Layout>
                            <SettingsPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
        </Suspense>
        <PwaUpdateNotification />
    </BrowserRouter>
    );
};

const CrmApp: React.FC = () => <App />;

export default CrmApp;
