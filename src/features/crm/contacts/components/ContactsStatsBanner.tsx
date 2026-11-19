import React from 'react';
import { Users, UserCheck, Building, UserMinus } from 'lucide-react';
import KpiCard from '@shared/components/KpiCard';
import type { ContactStats } from '../schemas/contacts.schema';

interface ContactsStatsBannerProps {
  stats: ContactStats;
}

export const ContactsStatsBanner: React.FC<ContactsStatsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-2">
      <KpiCard
        label="Total Contactos"
        value={stats.total}
        subtext="registrados"
        tone="slate"
        icon={<Users size={20} className="text-indigo-600" />}
      />
      <KpiCard
        label="Contactos Activos"
        value={stats.active}
        subtext="disponibles"
        tone="emerald"
        icon={<UserCheck size={20} />}
      />
      <KpiCard
        label="Cuentas B2B / Empresa"
        value={stats.withCompany}
        subtext="vinculados"
        tone="violet"
        icon={<Building size={20} />}
      />
      <KpiCard
        label="Independientes"
        value={stats.withoutCompany}
        subtext="sin cuenta B2B"
        tone="slate"
        icon={<UserMinus size={20} />}
      />
    </div>
  );
};
