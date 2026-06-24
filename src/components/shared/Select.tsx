import React from 'react';
import ReactSelect from 'react-select';
import type { Props as SelectProps } from 'react-select';

interface CustomSelectProps extends SelectProps<any, boolean> {
    label?: string;
    error?: string;
}

export const getSelectStyles = (error?: string) => ({
    control: (baseStyles: any, state: any) => ({
        ...baseStyles,
        borderRadius: '1rem',
        borderColor: error ? '#fca5a5' : state.isFocused ? '#4f46e5' : '#e2e8f0',
        boxShadow: state.isFocused 
            ? '0 10px 15px -3px rgba(79, 70, 229, 0.1), 0 4px 6px -4px rgba(79, 70, 229, 0.1)' 
            : 'none',
        minHeight: '54px',
        backgroundColor: error ? 'rgba(254, 242, 242, 0.3)' : '#fff',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
            borderColor: error ? '#fca5a5' : state.isFocused ? '#4f46e5' : '#cbd5e1'
        }
    }),
    valueContainer: (baseStyles: any) => ({
        ...baseStyles,
        paddingLeft: '1rem',
    }),
    singleValue: (baseStyles: any) => ({
        ...baseStyles,
        color: '#0f172a',
        fontWeight: '500',
    }),
    menu: (baseStyles: any) => ({
        ...baseStyles,
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
        marginTop: '6px',
        backgroundColor: '#ffffff',
        zIndex: 50,
    }),
    menuList: (baseStyles: any) => ({
        ...baseStyles,
        padding: '6px',
        backgroundColor: '#ffffff'
    }),
    option: (baseStyles: any, state: any) => ({
        ...baseStyles,
        borderRadius: '0.75rem',
        backgroundColor: state.isSelected 
            ? '#4f46e5' 
            : state.isFocused 
            ? '#eff6ff' 
            : 'transparent',
        color: state.isSelected ? '#ffffff' : '#334155',
        fontWeight: '600',
        fontSize: '12px',
        padding: '10px 14px',
        margin: '2px 0',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:active': {
            backgroundColor: '#4f46e5'
        }
    }),
    indicatorSeparator: () => ({
        display: 'none'
    }),
    dropdownIndicator: (baseStyles: any, state: any) => ({
        ...baseStyles,
        color: state.isFocused ? '#4f46e5' : '#94a3b8',
        paddingRight: '12px',
        transition: 'color 0.3s ease',
        '&:hover': {
            color: '#4f46e5'
        }
    }),
    placeholder: (baseStyles: any) => ({
        ...baseStyles,
        color: '#94a3b8',
        fontWeight: '500'
    })
});

export const Select: React.FC<CustomSelectProps> = ({
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
            <ReactSelect
                placeholder="Seleccione una opción..."
                isSearchable={false}
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

export default Select;
