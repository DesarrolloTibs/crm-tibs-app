import React from 'react';
import {
  Brain,
  Sliders,
  Link2,
  Cpu,
  Smartphone,
  Facebook,
  Instagram,
} from 'lucide-react';
import type { AiAgentStats } from '../schemas/aiAgent.schema';

interface AiAgentStatsBannerProps {
  stats: AiAgentStats;
}

export const AiAgentStatsBanner: React.FC<AiAgentStatsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Estado Global del Agente IA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Respuesta Automática
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                stats.isAgentActive
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-base font-extrabold text-slate-800">
              {stats.isAgentActive ? 'Agente Activo' : 'En Pausa'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            {stats.isAgentActive ? 'Respondiendo en canales' : 'Atención manual únicamente'}
          </p>
        </div>
        <div
          className={`p-3 rounded-2xl ${
            stats.isAgentActive
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              : 'bg-slate-50 text-slate-400 border border-slate-200'
          }`}
        >
          <Brain size={22} />
        </div>
      </div>

      {/* 2. Sub-Agentes Configurados */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Orquestador Multi-Agente
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-slate-800">
              {stats.activeSubAgents}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              / {stats.totalSubAgents} activos
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            {stats.inactiveSubAgents > 0
              ? `${stats.inactiveSubAgents} sub-agente(s) en pausa`
              : 'Todos los agentes operativos'}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
          <Sliders size={22} />
        </div>
      </div>

      {/* 3. Canales de Comunicación Meta */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Canales Conectados
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`p-1 rounded-md text-[10px] border flex items-center gap-0.5 ${
                stats.hasWhatsApp
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
              title={stats.hasWhatsApp ? 'WhatsApp Cloud API Conectado' : 'WhatsApp Desconectado'}
            >
              <Smartphone size={11} /> WA
            </span>
            <span
              className={`p-1 rounded-md text-[10px] border flex items-center gap-0.5 ${
                stats.hasFacebook
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
              title={stats.hasFacebook ? 'Facebook Messenger Conectado' : 'Facebook Desconectado'}
            >
              <Facebook size={11} /> FB
            </span>
            <span
              className={`p-1 rounded-md text-[10px] border flex items-center gap-0.5 ${
                stats.hasInstagram
                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
              title={stats.hasInstagram ? 'Instagram Direct Conectado' : 'Instagram Desconectado'}
            >
              <Instagram size={11} /> IG
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            {stats.totalChannels > 0
              ? `${stats.totalChannels} canal(es) vinculados`
              : 'Sin canales Meta vinculados'}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
          <Link2 size={22} />
        </div>
      </div>

      {/* 4. Parámetros de Inferencia */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Parámetros de Inferencia
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
              Temp: {stats.temperature}
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
              Hist: {stats.historyLimit} msg
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            {stats.temperature <= 0.3
              ? 'Modo Alta Precisión'
              : stats.temperature >= 0.7
              ? 'Modo Alta Creatividad'
              : 'Modo Equilibrado'}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
          <Cpu size={22} />
        </div>
      </div>
    </div>
  );
};
