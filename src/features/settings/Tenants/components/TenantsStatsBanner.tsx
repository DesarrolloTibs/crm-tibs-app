import React from 'react';
import { Building2, CheckCircle2, ShieldAlert, Clock, Zap } from 'lucide-react';
import KpiCard from '@shared/components/KpiCard';
import type { TenantsStats } from '../schemas/tenants.schema';

interface TenantsStatsBannerProps {
  stats: TenantsStats;
}

export const TenantsStatsBanner: React.FC<TenantsStatsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 mb-2">
      <KpiCard
        label="Total Inquilinos"
        value={stats.total}
        subtext="tenants"
        tone="slate"
        icon={<Building2 size={20} className="text-indigo-600" />}
      />
      <KpiCard
        label="Activas"
        value={stats.active}
        subtext="operando"
        tone="emerald"
        icon={<CheckCircle2 size={20} />}
      />
      <KpiCard
        label="Inactivas / Expiradas"
        value={stats.inactive}
        subtext="bloqueadas"
        tone="rose"
        icon={<ShieldAlert size={20} />}
      />
      <KpiCard
        label="Con Cola Activa"
        value={stats.withQueue}
        subtext="prepago"
        tone="amber"
        icon={<Clock size={20} />}
      />
      <KpiCard
        label="Sobregiro Permitido"
        value={stats.allowExtra}
        subtext="habilitadas"
        tone="purple"
        icon={<Zap size={20} />}
        className="col-span-2 sm:col-span-1"
      />
    </div>
  );
};
