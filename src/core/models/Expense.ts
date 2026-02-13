export interface Expense {
    id?: string;
    fecha: string; // YYYY-MM-DD
    concepto: string;
    monto: number;
    client_id?: string | null;
    opportunity_id?: string | null;
    // Optional expanded properties for display if backend returns them
    client?: {
        id: string;
        nombre: string;
        apellido: string;
        empresa: string;
    };
    opportunity?: {
        id: string;
        nombre_proyecto: string;
    };
    usuario?: {
        id: string;
        username: string;
        email: string;
    };
    receiptUrl?: string;
}
