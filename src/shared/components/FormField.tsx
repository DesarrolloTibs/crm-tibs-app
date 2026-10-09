import React from 'react';
import Input from './Input';
import TextArea from './TextArea';

interface FormFieldProps {
  /** Identificador único del campo */
  id?: string;
  /** Etiqueta visible */
  label?: string;
  /** Mensaje de error de validación */
  error?: string;
  /** Tipo de campo: 'input' | 'textarea' */
  as?: 'input' | 'textarea';
  /** Prefijo visual (ej: símbolo de moneda) */
  inputPrefix?: React.ReactNode;
  /** Resto de props nativas del input/textarea */
  [key: string]: unknown;
}

/**
 * FormField — Wrapper unificado que combina Input o TextArea con su label y error.
 * Elimina el patrón repetitivo de label + input + mensaje de error en cada formulario.
 */
const FormField: React.FC<FormFieldProps> = ({
  as = 'input',
  label,
  error,
  inputPrefix,
  id,
  ...rest
}) => {
  if (as === 'textarea') {
    return (
      <TextArea
        id={id}
        label={label}
        error={error}
        {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    );
  }

  return (
    <Input
      id={id}
      label={label}
      error={error}
      inputPrefix={inputPrefix}
      {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
    />
  );
};

export default FormField;
