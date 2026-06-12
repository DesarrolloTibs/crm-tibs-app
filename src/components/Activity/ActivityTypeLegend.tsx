import React from 'react';
import { ACTIVITY_COLORS } from './activityColors';

/**
 * Muestra los chips de colores que explican qué color corresponde
 * a cada tipo de actividad.
 */
const ActivityTypeLegend: React.FC = () => (
    <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(ACTIVITY_COLORS).map(([type, color]) => (
            <span
                key={type}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-white shadow-sm select-none"
                style={{ backgroundColor: color.bg }}
            >
                <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
                {type}
            </span>
        ))}
    </div>
);

export default ActivityTypeLegend;
