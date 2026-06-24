import React from 'react';
import { getActivityColor } from './activityColors';
import type { TypeActivity } from '../../core/models/Activity';

interface Props {
    activityTypes: TypeActivity[];
}

/**
 * Muestra los chips de colores que explican qué color corresponde
 * a cada tipo de actividad dinámico obtenido de la base de datos.
 */
const ActivityTypeLegend: React.FC<Props> = ({ activityTypes }) => (
    <div className="flex flex-wrap gap-2 mb-4">
        {activityTypes.map((type) => {
            const color = getActivityColor(type.strname);
            return (
                <span
                    key={type.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm select-none border border-black/5"
                    style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
                >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color.border }} />
                    {type.strname}
                </span>
            );
        })}
    </div>
);

export default ActivityTypeLegend;
