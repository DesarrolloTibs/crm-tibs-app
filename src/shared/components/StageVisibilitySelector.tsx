import React, { useState, useRef, useEffect } from 'react';
import { Columns, CheckSquare, Square } from 'lucide-react';

export interface SelectorStage {
    id: string;
    strname: string;
    blnstatus: boolean;
}

interface StageVisibilitySelectorProps {
    stages: SelectorStage[];
    visibleStageIds: string[];
    onVisibilityChange: (stageId: string) => void;
    zIndex?: number;
    labelSize?: 'sm' | 'xs';
    themeColor?: 'indigo' | 'blue';
    align?: 'left' | 'responsive';
}

export const StageVisibilitySelector: React.FC<StageVisibilitySelectorProps> = ({
    stages,
    visibleStageIds,
    onVisibilityChange,
    zIndex = 20,
    labelSize = 'sm',
    themeColor = 'indigo',
    align = 'left',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeStages = stages.filter(s => s.blnstatus);

    const alignmentClass = align === 'responsive'
        ? 'left-0 sm:right-0 sm:left-auto'
        : 'left-0';

    const labelClass = labelSize === 'xs'
        ? 'text-xs font-semibold text-slate-700'
        : 'text-sm text-slate-700';

    const checkboxSize = labelSize === 'xs' ? 14 : 16;

    const checkedColorClass = themeColor === 'blue'
        ? 'text-blue-600'
        : 'text-indigo-600';

    return (
        <div className="relative w-full sm:w-auto" ref={containerRef}>
            <button
                type="button"
                className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm font-semibold cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Columns size={16} />
                <span>Etapas</span>
            </button>
            {isOpen && (
                <div
                    className={`absolute ${alignmentClass} mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-4`}
                    style={{ zIndex }}
                >
                    <h4 className="font-semibold text-sm mb-2 text-slate-800">Mostrar/Ocultar Etapas</h4>
                    <div className="space-y-2">
                        {activeStages.map(stage => {
                            const isChecked = visibleStageIds.includes(stage.id);
                            const isDisabled = isChecked && visibleStageIds.length <= 3;
                            return (
                                <label
                                    key={stage.id}
                                    className={`flex items-center space-x-2 ${labelClass} ${
                                        isDisabled
                                            ? 'cursor-not-allowed text-gray-400'
                                            : 'cursor-pointer'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={isDisabled}
                                        onChange={() => {
                                            if (!isDisabled) {
                                                onVisibilityChange(stage.id);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    {isChecked ? (
                                        <CheckSquare
                                            size={checkboxSize}
                                            className={isDisabled ? 'text-gray-400' : checkedColorClass}
                                        />
                                    ) : (
                                        <Square
                                            size={checkboxSize}
                                            className="text-gray-400"
                                        />
                                    )}
                                    <span className={isDisabled ? 'text-gray-400' : ''}>{stage.strname}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StageVisibilitySelector;
