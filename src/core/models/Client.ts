import type { User } from "./User";

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
    empresa: string;
    puesto: string;
    telefono: string;
    estatus?: boolean;
    ejecutivo_id?: string;
    ejecutivo?: User;
    category?: ClientCategoryType;
}