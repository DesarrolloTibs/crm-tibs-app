import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@core/guards/ProtectedRoute';
import { Layout } from '@app/layout';
import '@app/layout/sidebar/animations.css';
import { PwaUpdateNotification } from '@shared/components';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@features/auth';
import { ClientsPage } from '@features/crm';
import { PipelinePage } from '@features/pipeline';
import { UsersPage } from '@features/users';
import { ActivitiesPage } from '@features/activities';
import { ExpensesPage } from '@features/expenses';
import { ProductsPage } from '@features/products';
import { HelpdeskPage, SupportTicketPage } from '@features/helpdesk';
import { DashboardPage } from '@features/dashboard';
import { ConversationsPage } from '@features/conversations';
import { SettingsPage, OAuthCallbackPopup } from '@features/settings';

const isOAuthPopup = typeof window !== 'undefined' && (
    window.location.search.includes('meta_oauth') ||
    window.location.search.includes('oauth=') ||
    window.name === 'meta-oauth-popup' ||
    window.location.pathname === '/oauth/callback'
);

const App: React.FC = () => {
    if (isOAuthPopup) {
        return <OAuthCallbackPopup />;
    }

    return (
        <BrowserRouter>
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
        <PwaUpdateNotification />
    </BrowserRouter>
    );
};

const CrmApp: React.FC = () => <App />;

export default CrmApp;
