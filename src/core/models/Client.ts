import type { User } from "./User";
import type { Company } from "./Company";

export const ClientCategory = {
    CONTACTO: 'Contacto',
    LEAD: 'Lead',
    CLIENTE: 'Cliente',
} as const;
export type ClientCategoryType = (typeof ClientCategory)[keyof typeof ClientCategory];

export interface Client {
    id?: string;
    nombre: string;
    apellido?: string | null;
    correo?: string | null;
    empresa?: string | null;
    puesto?: string | null;
    telefono?: string | null;
    estatus?: boolean;
    ejecutivo_id?: string | null;
    ejecutivo?: User;
    category?: ClientCategoryType;
    companyId?: string | null;
    company?: Company | null;
}
