import React, { forwardRef } from 'react';
import { X } from 'lucide-react';

export type InputSize = 'default' | 'sm';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  inputPrefix?: React.ReactNode;
  size?: InputSize;
  onClear?: () => void;
  clearTitle?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      inputPrefix,
      size = 'default',
      onClear,
      clearTitle = 'Limpiar',
      containerClassName = 'w-full',
      className = '',
      ...props
    },
    ref
  ) => {
    const isSmall = size === 'sm';
    const hasClearButton =
      Boolean(onClear) &&
      !props.disabled &&
      props.value !== undefined &&
      props.value !== null &&
      String(props.value).length > 0;

    const sizeStyles = isSmall
      ? 'py-1.5 rounded-xl text-xs bg-slate-50 focus:bg-white'
      : 'py-4 rounded-2xl text-sm focus:shadow-xl focus:shadow-indigo-500/10 focus:bg-white';

    const leftPad = inputPrefix ? (isSmall ? 'pl-8' : 'pl-8') : isSmall ? 'pl-3' : 'pl-4';
    const rightPad = hasClearButton ? (isSmall ? 'pr-7' : 'pr-9') : isSmall ? 'pr-3' : 'pr-4';

    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={props.id}
            className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {inputPrefix && (
            <div
              className={`absolute inset-y-0 left-0 ${
                isSmall ? 'pl-3' : 'pl-4'
              } flex items-center pointer-events-none text-slate-400 font-semibold text-sm`}
            >
              {inputPrefix}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full text-slate-900 font-medium transition-all duration-300 border border-slate-200 outline-none hover:border-slate-300 focus:border-indigo-600 placeholder:text-slate-400 placeholder:font-medium ${sizeStyles} ${leftPad} ${rightPad} ${
              error ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500' : ''
            } ${className}`}
            {...props}
            value={props.value === null ? '' : props.value}
          />
          {hasClearButton && (
            <button
              type="button"
              onClick={onClear}
              title={clearTitle}
              className={`absolute inset-y-0 right-1.5 my-auto flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer ${
                isSmall ? 'w-5 h-5' : 'w-6 h-6'
              }`}
            >
              <X size={isSmall ? 12 : 14} />
            </button>
          )}
        </div>
        {error && (
          <p className="text-rose-600 text-[10px] font-medium mt-1 ml-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
