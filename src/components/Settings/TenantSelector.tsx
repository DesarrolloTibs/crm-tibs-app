import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Building2, ChevronDown, Check, Lock } from 'lucide-react';
import { useConfigStore } from '../../store/useConfigStore';
import { getTenants } from '../../services/tenantsService';

interface Props {
  activeTab?: string;
}

const SUPERADMIN_ONLY_TABS = ['superadmin-tenants', 'superadmin-plans', 'superadmin-ai-credentials'];

const TenantSelector: React.FC<Props> = ({ activeTab: propActiveTab }) => {
  const location = useLocation();
  const { selectedTenant, setSelectedTenant, tenants, setTenants } = useConfigStore();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentTab, setCurrentTab] = useState<string>(() => {
    return propActiveTab || sessionStorage.getItem('settingsActiveTab') || '';
  });

  useEffect(() => {
    if (propActiveTab) {
      setCurrentTab(propActiveTab);
    }
  }, [propActiveTab]);

  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail) {
        setCurrentTab(e.detail);
      }
    };
    window.addEventListener('settingsTabChanged', handleTabChange);
    return () => window.removeEventListener('settingsTabChanged', handleTabChange);
  }, []);

  const isSuperAdminSection = location.pathname.startsWith('/settings') && SUPERADMIN_ONLY_TABS.includes(currentTab);

  useEffect(() => {
    if (isSuperAdminSection) {
      setIsOpen(false);
      if (selectedTenant !== null) {
        setSelectedTenant(null);
      }
    }
  }, [isSuperAdminSection, selectedTenant, setSelectedTenant]);

  useEffect(() => {
    setIsOpen(false);
  }, [currentTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const loadData = async () => {
      if (tenants.length > 0) return;
      setLoading(true);
      try {
        const data = await getTenants();
        setTenants(data);
      } catch (err) {
        console.error('Error al cargar la lista de organizaciones:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [tenants.length, setTenants]);

  const handleSelect = (t: any) => {
    if (isSuperAdminSection) return;
    setSelectedTenant({
      id: t.id,
      name: t.name,
      schema_name: t.schema_name,
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    if (isSuperAdminSection) return;
    setSelectedTenant(null);
    setIsOpen(false);
  };

  if (loading) {
    return <div className="h-10 w-48 bg-slate-100 rounded-xl animate-pulse" />;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => !isSuperAdminSection && setIsOpen(!isOpen)}
        disabled={isSuperAdminSection}
        title={isSuperAdminSection ? 'Sección exclusiva de SuperAdmin (Fijado en Public/Global)' : ''}
        className={`flex items-center gap-2.5 px-4 py-2 border rounded-xl text-sm font-semibold transition-all shadow-sm ${
          isSuperAdminSection
            ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed opacity-90'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
        }`}
      >
        <Building2 size={16} className={isSuperAdminSection ? "text-slate-400" : "text-indigo-600"} />
        <span className="truncate max-w-[160px]">
          {isSuperAdminSection ? 'Public / Global' : (selectedTenant ? selectedTenant.name : 'Organización Global')}
        </span>
        {isSuperAdminSection ? (
          <Lock size={14} className="text-slate-400" />
        ) : (
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {!isSuperAdminSection && isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 max-h-80 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Contexto de Organización
          </div>

          <button
            type="button"
            onClick={handleClear}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              !selectedTenant ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Public / Global</span>
            {!selectedTenant && <Check size={14} className="text-indigo-600" />}
          </button>

          <div className="my-1 border-t border-slate-100" />

          {(Array.isArray(tenants) ? tenants : []).map(t => {
            const isSelected = selectedTenant?.id === t.id;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => handleSelect(t)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="truncate text-left">
                  <p className="truncate">{t.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{t.schema_name}</p>
                </div>
                {isSelected && <Check size={14} className="text-indigo-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TenantSelector;
