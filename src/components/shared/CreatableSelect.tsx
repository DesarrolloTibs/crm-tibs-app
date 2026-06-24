import React from 'react';
import ReactSelectCreatable from 'react-select/creatable';
import { getSelectStyles } from './Select';

interface CustomCreatableSelectProps extends React.ComponentProps<typeof ReactSelectCreatable> {
    label?: string;
    error?: string;
}

export const CreatableSelect: React.FC<CustomCreatableSelectProps> = ({
    label,
    error,
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
                    {label}
                </label>
            )}
            <ReactSelectCreatable
                placeholder="Seleccione o cree una opción..."
                className="w-full text-sm font-medium text-slate-900"
                styles={getSelectStyles(error)}
                {...props}
            />
            {error && (
                <p className="text-rose-600 text-[10px] font-medium mt-1 ml-1">
                    {error}
                </p>
            )}
        </div>
    );
};

export default CreatableSelect;
