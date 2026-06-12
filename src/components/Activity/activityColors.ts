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
    if (!typeName) {
        return { bg: '#6B7280', border: '#4B5563', text: '#ffffff' };
    }

    // Calcular un hash simple a partir del nombre
    let hash = 0;
    for (let i = 0; i < typeName.length; i++) {
        hash = typeName.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generar un Hue (matiz) entre 0 y 360 grados
    const hue = Math.abs(hash) % 360;
    
    // Usar valores fijos de saturación y luminosidad para asegurar legibilidad y armonía (tonos agradables)
    const bg = `hsl(${hue}, 70%, 50%)`;
    const border = `hsl(${hue}, 70%, 40%)`;

    return {
        bg,
        border,
        text: '#ffffff',
    };
};

