import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface StepperStage {
    id: string;
    strname: string;
    blnstatus: boolean;
    blninitial: boolean;
    stage_type?: number;
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
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
    const moreButtonRef = useRef<HTMLButtonElement>(null);

    const foldedNames = ['resuelto', 'cancelado', 'cancelada', 'ganada', 'perdida', 'lost', 'won', 'cancelled', 'solved', 'standby'];
    const activeStages = stages.filter(s => s.blnstatus);

    const isStageFolded = (s: StepperStage) => {
        if (s.stage_type !== undefined && s.stage_type !== null) {
            return Number(s.stage_type) === 1 || Number(s.stage_type) === 2;
        }
        return foldedNames.includes(s.strname.trim().toLowerCase());
    };

    const mainStages = activeStages.filter(s => {
        const isFolded = isStageFolded(s);
        return !isFolded || s.id === currentStageId;
    });

    const foldedStages = activeStages.filter(s => {
        const isFolded = isStageFolded(s);
        return isFolded && s.id !== currentStageId;
    });

    const updateDropdownPosition = useCallback(() => {
        if (!moreButtonRef.current) return;
        const rect = moreButtonRef.current.getBoundingClientRect();
        const dropdownWidth = 190;
        let left = rect.right - dropdownWidth;
        if (left < 10) left = 10;
        if (left + dropdownWidth > window.innerWidth - 10) {
            left = window.innerWidth - dropdownWidth - 10;
        }

        const top = rect.bottom + 6;
        setDropdownPosition({ top, left });
    }, []);

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!showStageDropdown) {
            if (moreButtonRef.current) {
                const rect = moreButtonRef.current.getBoundingClientRect();
                const dropdownWidth = 190;
                let left = rect.right - dropdownWidth;
                if (left < 10) left = 10;
                if (left + dropdownWidth > window.innerWidth - 10) {
                    left = window.innerWidth - dropdownWidth - 10;
                }
                const top = rect.bottom + 6;
                setDropdownPosition({ top, left });
            }
            setShowStageDropdown(true);
        } else {
            setShowStageDropdown(false);
        }
    };

    useEffect(() => {
        if (!showStageDropdown) return;
        updateDropdownPosition();

        const handleScrollOrResize = () => {
            updateDropdownPosition();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowStageDropdown(false);
            }
        };

        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showStageDropdown, updateDropdownPosition]);

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
                            ref={moreButtonRef}
                            type="button"
                            onClick={toggleDropdown}
                            className="odoo-step cursor-pointer px-4 font-bold"
                            title="Más etapas"
                        >
                            ...
                        </button>

                        {showStageDropdown && dropdownPosition && createPortal(
                            <>
                                <div
                                    className="fixed inset-0 z-[9998] bg-transparent"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowStageDropdown(false);
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'fixed',
                                        top: `${dropdownPosition.top}px`,
                                        left: `${dropdownPosition.left}px`,
                                        zIndex: 9999,
                                    }}
                                    className="w-48 bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 flex flex-col animate-in fade-in zoom-in-95 duration-100"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {foldedStages.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStageClick(s);
                                                setShowStageDropdown(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-between"
                                        >
                                            <span>{s.strname}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                            , document.body
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StageStepper;
