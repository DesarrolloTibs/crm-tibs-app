import React, { useEffect, useState, useMemo, useRef } from 'react';
import Select from '../../components/shared/Select';
import { useAuth } from '../../hooks/useAuth';
import {
  ClipboardList, Settings, Sliders, Database, Bell,
  LayoutDashboard, Brain, Building2, Layers, KeyRound, Calendar
} from 'lucide-react';

// Módulo modular de Tipos de Actividad
import ActivityTypesPage from './ActivityTypes/ActivityTypesPage';
// Módulo modular de Etiquetas de Catálogos (Oportunidades)
import OpportunityLabelsPage from './OpportunityLabels/OpportunityLabelsPage';
// Módulo modular de Notificaciones Automáticas (Daemon Cron & Reglas)
import AutomaticNotificationsPage from './AutomaticNotifications/AutomaticNotificationsPage';
// Módulo modular de Indicadores de Dashboard (KPIs y Gráficos)
import DashboardIndicatorsPage from './DashboardIndicators/DashboardIndicatorsPage';
// Módulo modular de Agente IA & Canales
import AiAgentChannelsPage from './AiAgentChannels/AiAgentChannelsPage';
// Módulo modular de Gestión de Organizaciones (Tenants & Multi-Tenancy)
import TenantsPage from './Tenants/TenantsPage';
// Módulo modular de Planes de Suscripción SaaS
import SubscriptionPlansPage from './SubscriptionPlans/SubscriptionPlansPage';
// Módulo modular de Credenciales & LLM Global
import GlobalAiCredentialsPage from './GlobalAiCredentials/GlobalAiCredentialsPage';
import SettingsSidebar from './SettingsSidebar';
// Módulo modular de Valores de Catálogos (Línea de Negocio, Tipo de Entrega, Licenciamiento)
import OpportunityCatalogsPage from './OpportunityCatalogs/OpportunityCatalogsPage';

// Módulo modular de Mi Calendario (integración Google, Outlook, iCloud)
import MyCalendarPage from './MyCalendar/MyCalendarPage';

// Módulo unificado y refactorizado de Mi Empresa (incluye Consumo de IA & Suscripción)
import MyCompanyPage from './MyCompany/MyCompanyPage';

import { useConfigStore } from '../../store/useConfigStore';
import { getOpportunityLabels } from '../../services/opportunityLabelsService';
import type { OpportunityLabel } from '../../core/models/OpportunityLabel';

export type SettingTab =
  | 'my-calendar' | 'my-company' | 'ai-consumption' | 'activity-types' | 'opportunity-labels' | 'opportunity-catalogs'
  | 'helpdesk-cron' | 'dashboard-settings' | 'ai-agent-settings'
  | 'superadmin-tenants' | 'superadmin-plans' | 'superadmin-ai-credentials';

export const SettingsPage: React.FC = () => {
  const { isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { selectedTenant } = useConfigStore();

  const [activeTab, setActiveTabState] = useState<SettingTab>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_oauth') || params.get('tab') === 'channels' || params.get('tab') === 'ai-agent-settings') {
      return 'ai-agent-settings';
    }
    if (params.get('tab') === 'ai-consumption' || params.get('tab') === 'consumption' || params.get('tab') === 'subscription') {
      return 'my-company';
    }
    const storedTab = sessionStorage.getItem('settingsActiveTab') as SettingTab;
    if (storedTab === 'ai-consumption') {
      return 'my-company';
    }
    return storedTab || 'my-calendar';
  });

  const [activeCatalogSubTab, setActiveCatalogSubTabState] = useState<'business-lines' | 'delivery-types' | 'licensings'>(
    () => (sessionStorage.getItem('settingsActiveCatalogSubTab') as ('business-lines' | 'delivery-types' | 'licensings')) || 'business-lines'
  );
  const [labels, setLabels] = useState<OpportunityLabel[]>([]);

  const setActiveTab = (tab: SettingTab) => {
    const finalTab = tab === 'ai-consumption' ? 'my-company' : tab;
    setActiveTabState(finalTab);
    sessionStorage.setItem('settingsActiveTab', finalTab);
    window.dispatchEvent(new CustomEvent('settingsTabChanged', { detail: finalTab }));
  };

  useEffect(() => {
    if (authLoading) return;

    let safeTab = activeTab;

    if (!isAdmin && safeTab !== 'my-calendar') {
      safeTab = 'my-calendar';
    } else if (!isSuperAdmin && ['superadmin-tenants', 'superadmin-plans', 'superadmin-ai-credentials'].includes(safeTab)) {
      safeTab = 'my-company';
    } else if (isAdmin && !sessionStorage.getItem('settingsActiveTab') && safeTab === 'my-calendar') {
      safeTab = 'my-company';
    }

    if (safeTab !== activeTab) {
      setActiveTab(safeTab);
    }
  }, [authLoading, isAdmin, isSuperAdmin, activeTab]);

  const setActiveCatalogSubTab = (subTab: 'business-lines' | 'delivery-types' | 'licensings') => {
    setActiveCatalogSubTabState(subTab);
    sessionStorage.setItem('settingsActiveCatalogSubTab', subTab);
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('settingsTabChanged', { detail: activeTab }));
  }, [activeTab]);

  const isFetchingLabelsRef = useRef<boolean>(false);

  const fetchLabels = async () => {
    if (isFetchingLabelsRef.current) return;
    isFetchingLabelsRef.current = true;
    try {
      setLabels(await getOpportunityLabels());
    } catch (err) {
      console.error('Error al cargar etiquetas en Configuración:', err);
    } finally {
      isFetchingLabelsRef.current = false;
    }
  };

  useEffect(() => {
    if (activeTab === 'opportunity-catalogs') {
      fetchLabels();
    }
  }, [activeTab]);

  const getLabelName = (key: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento', defaultName: string) => {
    const label = labels.find(l => l.field_key === key);
    return label?.strname || defaultName;
  };

  const mobileOptions = useMemo(() => {
    const opts = [{ value: 'my-calendar', label: 'Mi Calendario' }];
    if (isAdmin) {
      opts.push(
        { value: 'my-company', label: 'Mi empresa' },
        { value: 'activity-types', label: 'Tipos de Actividad' },
        { value: 'opportunity-labels', label: 'Etiquetas de Catálogos' },
        { value: 'opportunity-catalogs', label: 'Valores de Catálogos' },
        { value: 'helpdesk-cron', label: 'Notificaciones automáticas' },
        { value: 'dashboard-settings', label: 'Indicadores de Dashboard' },
        { value: 'ai-agent-settings', label: 'Agente IA & Canales' }
      );
    }
    if (isSuperAdmin) {
      opts.push(
        { value: 'superadmin-tenants', label: 'Gestión de Organizaciones' },
        { value: 'superadmin-plans', label: 'Planes de Suscripción' },
        { value: 'superadmin-ai-credentials', label: 'Credenciales & LLM Global' }
      );
    }
    return opts;
  }, [isAdmin, isSuperAdmin]);

  const sections = useMemo(() => {
    const list = [
      { title: 'Personal', options: [{ id: 'my-calendar', label: 'Mi Calendario', icon: <Calendar size={16} /> }] }
    ];
    if (isAdmin) {
      list.push(
        {
          title: 'Organización',
          options: [
            { id: 'my-company', label: 'Mi empresa', icon: <Building2 size={16} /> },
          ]
        },
        { title: 'Actividades', options: [{ id: 'activity-types', label: 'Tipos de Actividad', icon: <ClipboardList size={16} /> }] },
        {
          title: 'Oportunidades', options: [
            { id: 'opportunity-labels', label: 'Etiquetas de Catálogos', icon: <Sliders size={16} /> },
            { id: 'opportunity-catalogs', label: 'Valores de Catálogos', icon: <Database size={16} /> },
          ],
        },
        { title: 'Mesa de ayuda', options: [{ id: 'helpdesk-cron', label: 'Notificaciones automáticas', icon: <Bell size={16} /> }] },
        { title: 'Dashboard', options: [{ id: 'dashboard-settings', label: 'Indicadores de Dashboard', icon: <LayoutDashboard size={16} /> }] },
        { title: 'Inteligencia Artificial', options: [{ id: 'ai-agent-settings', label: 'Agente IA & Canales', icon: <Brain size={16} /> }] }
      );
    }
    if (isSuperAdmin) {
      list.push({
        title: 'SuperAdministrador & Multi-Tenancy', options: [
          { id: 'superadmin-tenants', label: 'Gestión de Organizaciones', icon: <Building2 size={16} /> },
          { id: 'superadmin-plans', label: 'Planes de Suscripción', icon: <Layers size={16} /> },
          { id: 'superadmin-ai-credentials', label: 'Credenciales & LLM Global', icon: <KeyRound size={16} /> },
        ],
      });
    }
    return list;
  }, [isAdmin, isSuperAdmin]);

  const renderContent = () => {
    switch (activeTab) {
      case 'my-calendar': return <MyCalendarPage />;
      case 'my-company':
      case 'ai-consumption':
        return <MyCompanyPage />;
      case 'activity-types': return <ActivityTypesPage />;
      case 'opportunity-labels': return <OpportunityLabelsPage onLabelsUpdated={fetchLabels} />;
      case 'helpdesk-cron': return <AutomaticNotificationsPage />;
      case 'dashboard-settings': return <DashboardIndicatorsPage />;
      case 'ai-agent-settings': return <AiAgentChannelsPage />;
      case 'superadmin-tenants': return <TenantsPage />;
      case 'superadmin-plans': return <SubscriptionPlansPage />;
      case 'superadmin-ai-credentials': return <GlobalAiCredentialsPage />;
      case 'opportunity-catalogs': return (
        <OpportunityCatalogsPage
          activeSubTab={activeCatalogSubTab}
          onSubTabChange={setActiveCatalogSubTab}
          getLabelName={getLabelName}
        />
      );
      default: return <div className="p-6 text-center text-gray-500">Selecciona una opción de configuración.</div>;
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center py-20 text-slate-400">Cargando configuración...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Settings size={28} className="text-blue-800" />
        <h1 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h1>
      </div>

      <div className="flex flex-col lg:flex-row bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        {/* Mobile selector */}
        <div className="lg:hidden p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-2">
          <label htmlFor="settings-tab-select" className="text-xs font-bold uppercase tracking-wider text-gray-400 select-none text-left">
            Categoría de Configuración
          </label>
          <Select
            inputId="settings-tab-select"
            value={mobileOptions.find(opt => opt.value === activeTab)}
            onChange={selected => { if (selected) setActiveTab(selected.value as SettingTab); }}
            options={mobileOptions}
            isSearchable={false}
          />
        </div>

        <SettingsSidebar sections={sections} activeTab={activeTab} onSelect={(id) => setActiveTab(id as SettingTab)} />

        <main key={selectedTenant?.schema_name || 'public'} className="flex-grow p-4 sm:p-6 lg:p-8 bg-white overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
