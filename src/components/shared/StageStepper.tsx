import React, { useState } from 'react';

export interface StepperStage {
    id: string;
    strname: string;
    blnstatus: boolean;
    blninitial: boolean;
}

interface StageStepperProps {
    stages: StepperStage[];
    currentStageId: string;
    stageEnteredAt?: string | Date | null;
    fallbackDate?: string | Date | null;
    showDuration?: boolean;
    onStageClick: (stage: StepperStage) => void;
}

const getStageDuration = (enteredAtStr?: string | Date | null) => {
    if (!enteredAtStr) return '';
    const entered = new Date(enteredAtStr);
    const diffMs = Date.now() - entered.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${Math.max(1, diffMins)}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
};

export const StageStepper: React.FC<StageStepperProps> = ({
    stages,
    currentStageId,
    stageEnteredAt,
    fallbackDate,
    showDuration = false,
    onStageClick,
}) => {
    const [showStageDropdown, setShowStageDropdown] = useState(false);

    const foldedNames = ['resuelto', 'cancelado', 'cancelada', 'ganada', 'perdida', 'lost', 'won', 'cancelled', 'solved', 'standby'];
    const activeStages = stages.filter(s => s.blnstatus);

    const mainStages = activeStages.filter(s => {
        const isFolded = foldedNames.includes(s.strname.trim().toLowerCase());
        return !isFolded || s.id === currentStageId;
    });

    const foldedStages = activeStages.filter(s => {
        const isFolded = foldedNames.includes(s.strname.trim().toLowerCase());
        return isFolded && s.id !== currentStageId;
    });

    return (
        <div className="w-full overflow-x-auto hide-scrollbar py-1 px-1 flex justify-start md:justify-end">
            <div className="odoo-statusbar select-none flex-shrink-0">
                {mainStages.map((s) => {
                    const isActive = s.id === currentStageId;
                    const duration = isActive && showDuration 
                        ? getStageDuration(stageEnteredAt || fallbackDate) 
                        : '';
                    return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                                onStageClick(s);
                                setShowStageDropdown(false);
                            }}
                            className={`odoo-step cursor-pointer ${isActive ? 'active' : ''}`}
                        >
                            <span>{s.strname}</span>
                            {duration && (
                                <span className="text-[10px] font-normal text-teal-650 opacity-90 ml-1">
                                    {duration}
                                </span>
                            )}
                        </button>
                    );
                })}

                {foldedStages.length > 0 && (
                    <div className="relative flex">
                        <button
                            type="button"
                            onClick={() => setShowStageDropdown(!showStageDropdown)}
                            className="odoo-step cursor-pointer px-4 font-bold"
                            title="Más etapas"
                        >
                            ...
                        </button>

                        {showStageDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-40 bg-transparent"
                                    onClick={() => setShowStageDropdown(false)}
                                />
                                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1 flex flex-col animate-in fade-in duration-100">
                                    {foldedStages.map((s) => (
                                        <button
                                          key={s.id}
                                          type="button"
                                          onClick={() => {
                                              onStageClick(s);
                                              setShowStageDropdown(false);
                                          }}
                                          className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md font-semibold transition-colors cursor-pointer"
                                        >
                                            {s.strname}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StageStepper;
