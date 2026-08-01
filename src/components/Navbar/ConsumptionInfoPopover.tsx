import React, { useState, useEffect, useRef } from 'react';
import { Info, Box, Database, Zap } from 'lucide-react';
import { io } from 'socket.io-client';
import { useConfigStore } from '../../store/useConfigStore';
import { getTenantConsumption } from '../../services/tenantsService';
import type { TenantConsumptionData } from '../../services/tenantsService';

const ConsumptionInfoPopover: React.FC = () => {
  const { selectedTenant } = useConfigStore();
  const [isOpen, setIsOpen] = useState(false);
  const [consumption, setConsumption] = useState<TenantConsumptionData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const schemaName = selectedTenant?.schema_name;

  const fetchConsumption = async (forceRefresh = false) => {
    try {
      const data = await getTenantConsumption(schemaName, forceRefresh);
      setConsumption(data);
    } catch (err) {
      console.error('Error al obtener información de consumo del tenant:', err);
    }
  };

  // Carga inicial y escucha de WebSockets en tiempo real
  useEffect(() => {
    fetchConsumption();

    if (!schemaName) return;

    // Conectar al socket usando la ruta del backend igual que Nodo
    const rawUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3091';
    const socketPath = rawUrl.includes('/backend') ? '/backend/socket.io' : '/socket.io';
    const socket = io({ path: socketPath });

    socket.on('tenant_consumption_updated', (data: { schemaName?: string }) => {
      if (!data?.schemaName || data.schemaName === schemaName) {
        fetchConsumption(true);
      }
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      } else {
        socket.once('connect', () => socket.disconnect());
      }
    };
  }, [schemaName]);

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

  const tokensUsed = consumption?.tokens_used ?? 0;
  const tokensExtraUsed = consumption?.tokens_extra_used ?? 0;
  const tokensLimit = consumption?.tokens_limit ?? 300000;
  const isExhausted = tokensUsed >= tokensLimit;
  const tokensPercent = Math.min(Math.round((tokensUsed / (tokensLimit || 1)) * 100), 100);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Si no hay un tenant seleccionado (ej. SuperUsuario en contexto Public / Global), ocultar el ícono de consumo
  if (!selectedTenant) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Información de Consumo del Tenant"
        className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-150/80 hover:bg-indigo-100/80 transition-all text-indigo-600 shadow-sm cursor-pointer flex items-center justify-center"
      >
        <Info size={18} className="text-indigo-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-150 rounded-3xl shadow-2xl z-50 p-6 animate-fade-in-down text-left">
          {/* Encabezado */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Box size={16} className="text-indigo-500 shrink-0" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                INFORMACIÓN DE CONSUMO
              </h4>
            </div>
            {consumption?.plan_name && (
              <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                {consumption.plan_name}
              </span>
            )}
          </div>

          {/* Sección Única de Consumo: TOKENS PLAN BASE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-amber-500 shrink-0" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  TOKENS PLAN BASE
                </span>
              </div>
              <span className="text-xs font-bold text-slate-700 font-mono transition-all duration-300">
                {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isExhausted ? 'bg-rose-500' : 'bg-amber-500'}`}
                style={{ width: `${tokensPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-1">
              <span>{tokensPercent}% consumido</span>
              <span>{(tokensLimit - tokensUsed > 0 ? tokensLimit - tokensUsed : 0).toLocaleString()} restantes</span>
            </div>
          </div>

          {/* SECCIÓN DE CONSUMO EXTRA (Únicamente si los recursos del plan base se han consumido) */}
          {isExhausted && (
            <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-600" />
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                    CONSUMO EXTRA
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  consumption?.allow_extra ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {consumption?.allow_extra ? 'Permitido' : 'Bloqueado'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-extrabold text-amber-900 font-mono pt-1">
                <span>Tokens Extra:</span>
                <span className="text-amber-600">+{tokensExtraUsed.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Footer de Renovación */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block mr-2 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
              RENOVACIÓN: {formatDate(consumption?.next_renewal_date)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumptionInfoPopover;
