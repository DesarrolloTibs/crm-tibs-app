import React from 'react';
import { Building2, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import KpiCard from '@shared/components/KpiCard';
import type { CompanyStats } from '../schemas/companies.schema';

interface CompaniesStatsBannerProps {
  stats: CompanyStats;
}

export const CompaniesStatsBanner: React.FC<CompaniesStatsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-2">
      <KpiCard
        label="Total Empresas B2B"
        value={stats.total}
        subtext="cuentas"
        tone="slate"
        icon={<Building2 size={20} className="text-violet-600" />}
      />
      <KpiCard
        label="Cuentas Activas"
        value={stats.active}
        subtext="operativas"
        tone="emerald"
        icon={<CheckCircle2 size={20} />}
      />
      <KpiCard
        label="Con Contactos"
        value={stats.withContacts}
        subtext="con nómina"
        tone="indigo"
        icon={<Users size={20} />}
      />
      <KpiCard
        label="Suspendidas / Inactivas"
        value={stats.inactive}
        subtext="bloqueadas"
        tone="slate"
        icon={<AlertCircle size={20} />}
      />
    </div>
  );
};
