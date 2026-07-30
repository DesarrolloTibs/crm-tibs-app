import React, { useEffect, useState, useMemo } from 'react';
import Select from '../components/shared/Select';
import { useAuth } from '../hooks/useAuth';
import { XCircle, ClipboardList, Settings, Sliders, Database, Bell, LayoutDashboard, Brain, Building2, Layers, KeyRound } from 'lucide-react';

import ActivityTypesSettings from '../components/ActivityType/ActivityTypesSettings';
import OpportunityLabelsSettings from '../components/OpportunityLabel/OpportunityLabelsSettings';
import HelpdeskCronSettings from '../components/Helpdesk/HelpdeskCronSettings';
import { DashboardSettings } from '../components/Dashboard/DashboardSettings';
import AiAgentSettings from '../components/Settings/AiAgentSettings';
import TenantsSection from '../components/Settings/TenantsSection';
import PlansSection from '../components/Settings/PlansSection';
import GlobalAiCredentialsSettings from '../components/Settings/GlobalAiCredentialsSettings';
import MyCompanySection from '../components/Settings/MyCompanySection';
import SettingsSidebar from '../components/Settings/SettingsSidebar';
import CatalogSubTabsPanel from '../components/Settings/CatalogSubTabsPanel';

import { useConfigStore } from '../store/useConfigStore';
import { getOpportunityLabels } from '../services/opportunityLabelsService';
import type { OpportunityLabel } from '../core/models/OpportunityLabel';

type SettingTab =
  | 'my-company' | 'activity-types' | 'opportunity-labels' | 'opportunity-catalogs'
  | 'helpdesk-cron' | 'dashboard-settings' | 'ai-agent-settings'
  | 'superadmin-tenants' | 'superadmin-plans' | 'superadmin-ai-credentials';

const SettingsPage: React.FC = () => {
  const { isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { selectedTenant } = useConfigStore();

  const [activeTab, setActiveTabState] = useState<SettingTab>(
    () => (sessionStorage.getItem('settingsActiveTab') as SettingTab) || 'my-company'
  );
  const [activeCatalogSubTab, setActiveCatalogSubTabState] = useState<'business-lines' | 'delivery-types' | 'licensings'>(
    () => (sessionStorage.getItem('settingsActiveCatalogSubTab') as any) || 'business-lines'
  );
  const [labels, setLabels] = useState<OpportunityLabel[]>([]);

  const setActiveTab = (tab: SettingTab) => {
    setActiveTabState(tab);
    sessionStorage.setItem('settingsActiveTab', tab);
    window.dispatchEvent(new CustomEvent('settingsTabChanged', { detail: tab }));
  };

  const setActiveCatalogSubTab = (subTab: 'business-lines' | 'delivery-types' | 'licensings') => {
    setActiveCatalogSubTabState(subTab);
    sessionStorage.setItem('settingsActiveCatalogSubTab', subTab);
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('settingsTabChanged', { detail: activeTab }));
  }, [activeTab]);

  const fetchLabels = async () => {
    try { setLabels(await getOpportunityLabels()); }
    catch (err) { console.error('Error al cargar etiquetas en Configuración:', err); }
  };

  useEffect(() => { fetchLabels(); }, [activeTab]);

  const getLabelName = (key: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento', defaultName: string) => {
    const label = labels.find(l => l.field_key === key);
    return label?.strname || defaultName;
  };

  const mobileOptions = useMemo(() => {
    const opts = [
      { value: 'my-company', label: 'Mi empresa' },
      { value: 'activity-types', label: 'Tipos de Actividad' },
      { value: 'opportunity-labels', label: 'Etiquetas de Catálogos' },
      { value: 'opportunity-catalogs', label: 'Valores de Catálogos' },
      { value: 'helpdesk-cron', label: 'Notificaciones automáticas' },
      { value: 'dashboard-settings', label: 'Indicadores de Dashboard' },
      { value: 'ai-agent-settings', label: 'Agente IA & Canales' },
    ];
    if (isSuperAdmin) {
      opts.push(
        { value: 'superadmin-tenants', label: 'Gestión de Organizaciones' },
        { value: 'superadmin-plans', label: 'Planes de Suscripción' },
        { value: 'superadmin-ai-credentials', label: 'Credenciales & LLM Global' }
      );
    }
    return opts;
  }, [isSuperAdmin]);

  const sections = useMemo(() => {
    const list = [
      { title: 'Organización', options: [{ id: 'my-company', label: 'Mi empresa', icon: <Building2 size={16} /> }] },
      { title: 'Actividades', options: [{ id: 'activity-types', label: 'Tipos de Actividad', icon: <ClipboardList size={16} /> }] },
      {
        title: 'Oportunidades', options: [
          { id: 'opportunity-labels', label: 'Etiquetas de Catálogos', icon: <Sliders size={16} /> },
          { id: 'opportunity-catalogs', label: 'Valores de Catálogos', icon: <Database size={16} /> },
        ],
      },
      { title: 'Mesa de ayuda', options: [{ id: 'helpdesk-cron', label: 'Notificaciones automáticas', icon: <Bell size={16} /> }] },
      { title: 'Dashboard', options: [{ id: 'dashboard-settings', label: 'Indicadores de Dashboard', icon: <LayoutDashboard size={16} /> }] },
      { title: 'Inteligencia Artificial', options: [{ id: 'ai-agent-settings', label: 'Agente IA & Canales', icon: <Brain size={16} /> }] },
    ];
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
  }, [isSuperAdmin]);

  const renderContent = () => {
    switch (activeTab) {
      case 'my-company': return <MyCompanySection />;
      case 'activity-types': return <ActivityTypesSettings />;
      case 'opportunity-labels': return <OpportunityLabelsSettings onLabelsUpdated={fetchLabels} />;
      case 'helpdesk-cron': return <HelpdeskCronSettings />;
      case 'dashboard-settings': return <DashboardSettings />;
      case 'ai-agent-settings': return <AiAgentSettings />;
      case 'superadmin-tenants': return <TenantsSection />;
      case 'superadmin-plans': return <PlansSection />;
      case 'superadmin-ai-credentials': return <GlobalAiCredentialsSettings />;
      case 'opportunity-catalogs': return (
        <CatalogSubTabsPanel
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

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
        <XCircle size={64} className="mb-4 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
        <p className="mt-2 text-sm text-gray-600">No tienes permisos de administrador para ver la configuración del sistema.</p>
      </div>
    );
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
