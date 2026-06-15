import type { User } from "./User";
import type { Client } from "./Client";

export interface Company {
    id?: string;
    nombre: string;
    correo?: string | null;
    telefono?: string | null;
    website?: string | null;
    direccion?: string | null;
    estatus?: boolean;
    ejecutivo_id?: string | null;
    ejecutivo?: User | null;
    contacts?: Client[];
    createdAt?: string;
}
