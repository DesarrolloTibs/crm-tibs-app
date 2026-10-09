import React from 'react';

interface SettingsContainerProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    rightAction?: React.ReactNode;
}

export const SettingsContainer: React.FC<SettingsContainerProps> = ({
    title,
    description,
    icon,
    children,
    rightAction
}) => {
    return (
        <div className="flex flex-col gap-6 w-full text-left animate-fade-in">
            {/* Standard Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
                <div className="flex items-start gap-3">
                    {icon && (
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-650">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {title}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
                {rightAction && (
                    <div className="shrink-0 w-full sm:w-auto">
                        {rightAction}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="w-full">
                {children}
            </div>
        </div>
    );
};

export default SettingsContainer;
