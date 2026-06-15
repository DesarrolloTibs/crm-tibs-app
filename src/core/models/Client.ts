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
    apellido: string;
    correo: string;
    empresa?: string | null;
    puesto: string;
    telefono: string;
    estatus?: boolean;
    ejecutivo_id?: string;
    ejecutivo?: User;
    category?: ClientCategoryType;
    companyId?: string | null;
    company?: Company | null;
}