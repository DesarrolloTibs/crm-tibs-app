export interface Client {
    id?: string;
    nombre: string;
    apellido: string;
    correo: string;
    empresa: string;
    puesto: string;
    telefono: string;
    estatus?: boolean;
}