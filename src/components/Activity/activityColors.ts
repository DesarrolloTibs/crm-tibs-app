export interface ActivityColor {
    bg: string;
    border: string;
    text: string;
}

export const ACTIVITY_COLORS: Record<string, ActivityColor> = {
    'Correo':                            { bg: '#3B82F6', border: '#2563EB', text: '#ffffff' },
    'Llamada':                           { bg: '#10B981', border: '#059669', text: '#ffffff' },
    'Evento':                            { bg: '#8B5CF6', border: '#7C3AED', text: '#ffffff' },
    'Presentación Servicios Presencial': { bg: '#F59E0B', border: '#D97706', text: '#ffffff' },
    'Presentación Servicios En Línea':   { bg: '#F97316', border: '#EA580C', text: '#ffffff' },
    'Seguimiento Oportunidad Línea':     { bg: '#06B6D4', border: '#0891B2', text: '#ffffff' },
    'Seguimiento Oportunidad Presencial':{ bg: '#6366F1', border: '#4F46E5', text: '#ffffff' },
    'Otros':                             { bg: '#6B7280', border: '#4B5563', text: '#ffffff' },
};

const DEFAULT_COLOR: ActivityColor = { bg: '#6B7280', border: '#4B5563', text: '#ffffff' };

export const getActivityColor = (type: string): ActivityColor =>
    ACTIVITY_COLORS[type] ?? DEFAULT_COLOR;

/** Lista canónica de tipos de actividad — fuente única de verdad. */
export const ACTIVITY_TYPES: string[] = Object.keys(ACTIVITY_COLORS);
