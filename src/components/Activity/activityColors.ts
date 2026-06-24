export interface ActivityColor {
    bg: string;
    border: string;
    text: string;
}

/**
 * Genera un color HSL armónico y consistente basado en una cadena (hash del nombre).
 * Esto asegura que el mismo tipo de actividad siempre tenga el mismo color aleatorio.
 */
export const getActivityColor = (typeName?: string): ActivityColor => {
    if (!typeName || typeName === 'Tipo de actividad eliminada') {
        return { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' };
    }

    // Calcular un hash simple a partir del nombre
    let hash = 0;
    for (let i = 0; i < typeName.length; i++) {
        hash = typeName.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generar un Hue (matiz) entre 0 y 360 grados
    const hue = Math.abs(hash) % 360;
    
    // Tonos pastel premium: 
    // Saturación moderada (45%) y luminosidad alta (92% para el fondo)
    // El texto tendrá un matiz idéntico pero con alta saturación (55%) y baja luminosidad (25%) para legibilidad
    const bg = `hsl(${hue}, 45%, 92%)`;
    const border = `hsl(${hue}, 35%, 82%)`;
    const text = `hsl(${hue}, 55%, 25%)`;

    return {
        bg,
        border,
        text,
    };
};

